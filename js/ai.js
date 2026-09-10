/**
 * Verba Orbis xAI client — three calls, json_object, per-attempt timeout
 */
(function (global) {
  const VO = (global.VerbaOrbis = global.VerbaOrbis || {});

  const MAX_TOKENS = { sense: 1200, zoneA: 5000, zoneB: 7800 };

  function extractJsonObject(text) {
    if (!text) throw new Error('Empty AI response');
    let s = String(text).trim();
    const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fence) s = fence[1].trim();
    const start = s.indexOf('{');
    const end = s.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) {
      throw new Error('No JSON object in response');
    }
    return s.slice(start, end + 1);
  }

  function repairJson(text, warnings) {
    let s = extractJsonObject(text);
    const tryParse = (src) => {
      try {
        return JSON.parse(src);
      } catch {
        return null;
      }
    };
    let parsed = tryParse(s);
    if (parsed) return parsed;

    const noTrail = s.replace(/,\s*([}\]])/g, '$1');
    parsed = tryParse(noTrail);
    if (parsed) {
      if (warnings) warnings.push('repaired-trailing-comma');
      return parsed;
    }

    let t = noTrail;
    const qCount = (t.match(/"/g) || []).length;
    if (qCount % 2 === 1) t += '"';
    let opens = 0;
    let squares = 0;
    let inStr = false;
    let esc = false;
    for (let i = 0; i < t.length; i++) {
      const ch = t[i];
      if (inStr) {
        if (esc) esc = false;
        else if (ch === '\\') esc = true;
        else if (ch === '"') inStr = false;
        continue;
      }
      if (ch === '"') inStr = true;
      else if (ch === '{') opens += 1;
      else if (ch === '}') opens -= 1;
      else if (ch === '[') squares += 1;
      else if (ch === ']') squares -= 1;
    }
    if (inStr) t += '"';
    while (squares > 0) {
      t += ']';
      squares -= 1;
    }
    while (opens > 0) {
      t += '}';
      opens -= 1;
    }
    parsed = tryParse(t);
    if (parsed) {
      if (warnings) warnings.push('repaired-truncated-json');
      return parsed;
    }
    throw new Error('UNPARSEABLE');
  }

  function normalizeBaseUrl(baseUrl) {
    let base = String(baseUrl || 'https://api.x.ai/v1').trim().replace(/\/+$/, '');
    if (/^https?:\/\/api\.x\.ai$/i.test(base)) base = 'https://api.x.ai/v1';
    base = base.replace(/\/v1\/v1$/i, '/v1');
    return base;
  }

  function parseApiErrorBody(text, status) {
    const raw = String(text || '').trim();
    if (!raw) return `HTTP ${status}`;
    try {
      const err = JSON.parse(raw);
      if (typeof err.error === 'string') return err.error;
      if (err.error && err.error.message) return err.error.message;
      if (err.message) return err.message;
      if (err.detail) return typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail);
      return raw.slice(0, 400);
    } catch {
      return raw.slice(0, 400);
    }
  }

  function attemptTimeoutMs(reasoningEffort) {
    if (reasoningEffort === 'medium') return 120000;
    if (reasoningEffort === 'high' || reasoningEffort === 'xhigh') return 180000;
    return 60000;
  }

  function combineSignals(userSignal, effort) {
    const ms = attemptTimeoutMs(effort);
    if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function' && typeof AbortSignal.any === 'function') {
      const perAttempt = AbortSignal.timeout(ms);
      return AbortSignal.any([userSignal, perAttempt].filter(Boolean));
    }
    const local = new AbortController();
    const t = setTimeout(() => local.abort('timeout'), ms);
    if (userSignal) {
      if (userSignal.aborted) {
        clearTimeout(t);
        local.abort('user');
      } else {
        userSignal.addEventListener('abort', () => {
          clearTimeout(t);
          local.abort('user');
        });
      }
    }
    return local.signal;
  }

  async function postChat(url, apiKey, body, { signal: userSignal, reasoningEffort } = {}) {
    const signal = combineSignals(userSignal, reasoningEffort);
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal,
    });
    const text = await res.text();
    return { res, text };
  }

  function mapHttpError(status, detail) {
    if (status === 401 || status === 403) return new Error(`API Key 無效或無權限：${detail}`);
    if (status === 404) return new Error(`找不到端點或模型（請檢查 Base URL 與 Model）。${detail}`);
    if (status === 429) return new Error(`速率限制 / Rate limited：${detail}`);
    return new Error(detail || `HTTP ${status}`);
  }

  function wrapNetwork(e) {
    const msg = (e && e.message) || String(e);
    if (e && (e.name === 'AbortError' || e.name === 'TimeoutError' || /aborted|timeout/i.test(msg))) {
      const err = new Error('TIMEOUT');
      err.code = 'TIMEOUT';
      throw err;
    }
    if (/Failed to fetch|NetworkError|CORS|Load failed|TypeError/i.test(msg)) {
      throw new Error(
        '無法連線到 API（CORS / 網路 / Base URL 錯誤）。請確認 Base URL 為 https://api.x.ai/v1'
      );
    }
    throw e;
  }

  function readContent(data) {
    const content = data && data.choices && data.choices[0] && data.choices[0].message
      ? data.choices[0].message.content
      : '';
    if (!content) {
      throw new Error('API 回傳空白內容（可能被安全過濾或模型無權限）');
    }
    return typeof content === 'string' ? content : JSON.stringify(content);
  }

  function buildBodies({ model, reasoningEffort, messages, maxTokens }) {
    const effort = reasoningEffort || 'low';
    const rf = { type: 'json_object' };
    return [
      {
        model,
        reasoning_effort: effort,
        response_format: rf,
        temperature: 0.2,
        max_tokens: maxTokens,
        messages,
      },
      {
        model,
        reasoning_effort: effort,
        response_format: rf,
        max_tokens: maxTokens,
        messages,
      },
      {
        model,
        reasoning_effort: effort,
        response_format: rf,
        messages,
      },
    ];
  }

  async function chatJson({
    apiKey,
    baseUrl,
    model,
    reasoningEffort,
    messages,
    maxTokens,
    signal,
    allowContinue,
  }) {
    if (!apiKey) {
      const err = new Error('NO_API_KEY');
      err.code = 'NO_API_KEY';
      throw err;
    }
    const url = `${normalizeBaseUrl(baseUrl)}/chat/completions`;
    const modelName = String(model || 'grok-4.6').trim();
    const warnings = [];
    const bodies = buildBodies({
      model: modelName,
      reasoningEffort,
      messages,
      maxTokens,
    });

    async function runBodies(list) {
      let lastStatus = 0;
      let lastDetail = '';
      try {
        for (let i = 0; i < list.length; i++) {
          const { res, text } = await postChat(url, apiKey, list[i], { signal, reasoningEffort });
          lastStatus = res.status;
          if (res.ok) {
            let data;
            try {
              data = JSON.parse(text);
            } catch {
              throw new Error('API 回傳不是 JSON');
            }
            const content = readContent(data);
            try {
              return { parsed: repairJson(content, warnings), warnings, model: modelName };
            } catch (parseErr) {
              if (parseErr && parseErr.message === 'UNPARSEABLE') {
                return { unparseable: true, warnings, model: modelName };
              }
              throw parseErr;
            }
          }
          lastDetail = parseApiErrorBody(text, res.status);
          if (res.status !== 400) break;
        }
      } catch (e) {
        wrapNetwork(e);
      }
      throw mapHttpError(lastStatus, lastDetail);
    }

    let result = await runBodies(bodies);
    if (result.unparseable && allowContinue) {
      const contMessages = messages.concat([
        { role: 'user', content: VO.prompts.CONTINUE_JSON },
      ]);
      const contBodies = [
        {
          model: modelName,
          reasoning_effort: reasoningEffort || 'low',
          response_format: { type: 'json_object' },
          messages: contMessages,
        },
      ];
      result = await runBodies(contBodies);
      if (result.parsed) result.warnings.push('retry:json');
    }
    if (result.unparseable || !result.parsed) {
      const err = new Error('UNPARSEABLE');
      err.code = 'UNPARSEABLE';
      throw err;
    }
    return result;
  }

  async function listSenses(opts) {
    const S = VO.schema;
    const P = VO.prompts;
    const detected = opts.detectedSourceLang || S.detectSourceLang(opts.query);
    const sourceLang = opts.sourceLang || 'auto';
    const effective = S.effectiveSourceLang(sourceLang, detected);
    const messages = [
      { role: 'system', content: P.SENSE_SYSTEM },
      {
        role: 'user',
        content: P.senseUser({
          query: opts.query,
          detected,
          sourceLang,
          effectiveSourceLang: effective,
        }),
      },
    ];
    const { parsed, warnings, model } = await chatJson({
      apiKey: opts.apiKey,
      baseUrl: opts.baseUrl,
      model: opts.model,
      reasoningEffort: opts.reasoningEffort,
      messages,
      maxTokens: MAX_TOKENS.sense,
      signal: opts.signal,
      allowContinue: true,
    });
    const list = S.normalizeSenseList(parsed, opts.query);
    return { list, warnings, model };
  }

  async function generateZoneA(opts) {
    const S = VO.schema;
    const P = VO.prompts;
    const messages = [
      { role: 'system', content: P.ZONE_A_SYSTEM },
      { role: 'user', content: P.zoneAUser(opts.lockedSense) },
    ];
    const { parsed, warnings, model } = await chatJson({
      apiKey: opts.apiKey,
      baseUrl: opts.baseUrl,
      model: opts.model,
      reasoningEffort: opts.reasoningEffort,
      messages,
      maxTokens: MAX_TOKENS.zoneA,
      signal: opts.signal,
      allowContinue: true,
    });
    const zoneA = S.normalizeZoneA(parsed, opts.lockedSense);
    if (zoneA.cards.some((c) => c._stub)) warnings.push('stubbed-lang:zoneA');
    return { zoneA, warnings, model };
  }

  async function generateZoneB(opts) {
    const S = VO.schema;
    const P = VO.prompts;
    const digest = opts.zoneADigest || S.digestZoneA(opts.zoneA);
    const messages = [
      { role: 'system', content: P.ZONE_B_SYSTEM },
      { role: 'user', content: P.zoneBUser(opts.lockedSense, digest) },
    ];
    const { parsed, warnings, model } = await chatJson({
      apiKey: opts.apiKey,
      baseUrl: opts.baseUrl,
      model: opts.model,
      reasoningEffort: opts.reasoningEffort,
      messages,
      maxTokens: MAX_TOKENS.zoneB,
      signal: opts.signal,
      allowContinue: true,
    });
    const zoneB = S.normalizeZoneB(parsed, opts.lockedSense);
    if (zoneB.cards.some((c) => c._stub)) warnings.push('stubbed-lang:zoneB');
    return { zoneB, warnings, model };
  }

  VO.ai = {
    extractJsonObject,
    repairJson,
    normalizeBaseUrl,
    listSenses,
    generateZoneA,
    generateZoneB,
    attemptTimeoutMs,
  };
})(typeof window !== 'undefined' ? window : globalThis);

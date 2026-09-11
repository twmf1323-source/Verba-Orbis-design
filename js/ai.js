(function (global) {
  const VA = (global.VerbaAthanor = global.VerbaAthanor || {});

  const PROVIDERS = {
    grok: {
      id: 'grok',
      label: 'Grok',
      hint: 'xAI · console.x.ai',
      placeholder: 'xai-…',
      keyUrl: 'https://console.x.ai',
      baseUrl: 'https://api.x.ai/v1',
      model: 'grok-4.6',
      models: ['grok-4.6', 'grok-4.5'],
    },
    deepseek: {
      id: 'deepseek',
      label: 'DeepSeek',
      hint: 'platform.deepseek.com',
      placeholder: 'sk-…',
      keyUrl: 'https://platform.deepseek.com/api_keys',
      baseUrl: 'https://api.deepseek.com',
      model: 'deepseek-v4-flash',
      models: ['deepseek-v4-flash', 'deepseek-v4-pro'],
    },
    google: {
      id: 'google',
      label: 'Google',
      hint: 'Google AI Studio · Gemini',
      placeholder: 'AIza…',
      keyUrl: 'https://aistudio.google.com/apikey',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
      model: 'gemini-3.8-flash',
      models: ['gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-2.5-pro'],
    },
  };

  function detectProvider(key) {
    const k = String(key || '').trim();
    if (/^xai-/i.test(k)) return 'grok';
    if (/^AIza/i.test(k)) return 'google';
    if (/^sk-/i.test(k)) return 'deepseek';
    return null;
  }

  function normalizeBaseUrl(baseUrl, provider) {
    let base = String(baseUrl || '').trim().replace(/\/+$/, '');
    const p = PROVIDERS[provider] ? provider : guessProviderFromUrl(base);
    if (p === 'grok' || /api\.x\.ai/i.test(base)) {
      if (!base || /^https?:\/\/api\.x\.ai$/i.test(base)) base = 'https://api.x.ai/v1';
      return base.replace(/\/v1\/v1$/i, '/v1');
    }
    if (p === 'deepseek' || /api\.deepseek\.com/i.test(base)) {
      return base || 'https://api.deepseek.com';
    }
    if (p === 'google' || /generativelanguage\.googleapis/i.test(base)) {
      if (!base) return 'https://generativelanguage.googleapis.com/v1beta/openai';
      if (/\/openai$/i.test(base)) return base;
      if (/\/v1beta$/i.test(base)) return base + '/openai';
      return base;
    }
    return (base || 'https://api.x.ai/v1').replace(/\/v1\/v1$/i, '/v1');
  }

  function guessProviderFromUrl(base) {
    if (/api\.deepseek\.com/i.test(base)) return 'deepseek';
    if (/googleapis\.com/i.test(base)) return 'google';
    return 'grok';
  }

  function parseApiErrorBody(text, status) {
    const raw = String(text || '').trim();
    if (!raw) return `HTTP ${status}`;
    try {
      const err = JSON.parse(raw);
      if (typeof err.error === 'string') return err.error;
      if (err.error?.message) return err.error.message;
      if (err.message) return err.message;
      return raw.slice(0, 400);
    } catch {
      return raw.slice(0, 400);
    }
  }

  function attemptTimeoutMs(effort) {
    if (effort === 'medium') return 120000;
    if (effort === 'high' || effort === 'xhigh') return 180000;
    return 60000;
  }

  function combineSignals(userSignal, effort) {
    const ms = attemptTimeoutMs(effort);
    if (typeof AbortSignal.timeout === 'function' && typeof AbortSignal.any === 'function') {
      const perAttempt = AbortSignal.timeout(ms);
      return AbortSignal.any([userSignal, perAttempt].filter(Boolean));
    }
    const local = new AbortController();
    const t = setTimeout(() => local.abort('timeout'), ms);
    userSignal?.addEventListener('abort', () => {
      clearTimeout(t);
      local.abort();
    });
    return local.signal;
  }

  async function postChat(url, apiKey, body, { signal, reasoningEffort }) {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: combineSignals(signal, reasoningEffort),
    });
    const text = await res.text();
    return { res, text };
  }

  function wrapSchema(name, schema) {
    return {
      type: 'json_schema',
      json_schema: { name, schema, strict: true },
    };
  }

  function mapEffort(provider, effort) {
    const e = effort || 'low';
    if (provider === 'deepseek') {
      if (e === 'medium') return 'high';
      if (e === 'xhigh') return 'max';
      if (e === 'high' || e === 'max') return e;
      return 'low';
    }
    return e;
  }

  function querySeed(word, lang) {
    const id = lang || VA.langs?.currentId?.() || 'fr';
    const q = VA.schema?.normalizeQuery?.(word) || String(word || '');
    const hex = VA.schema?.fnv1aHex?.(`${id}|${q}|v2`) || '1';
    return parseInt(hex.slice(0, 8), 16) % 2147483647;
  }

  function buildBodies(provider, { model, effort, messages, schemaName, schema, seed }) {
    const jsonObject = { type: 'json_object' };
    const stable = { temperature: 0 };
    const grokFirst = Number.isFinite(seed) ? { temperature: 0, seed } : stable;
    if (provider === 'deepseek') {
      const dsEffort = mapEffort('deepseek', effort);
      const thinking = { type: effort === 'low' ? 'disabled' : 'enabled' };
      return [
        { model, messages, thinking, reasoning_effort: dsEffort, response_format: jsonObject, ...stable },
        { model, messages, reasoning_effort: dsEffort, response_format: jsonObject, ...stable },
        { model, messages, response_format: jsonObject, ...stable },
        { model, messages, ...stable },
      ];
    }
    if (provider === 'google') {
      return [
        { model, messages, response_format: jsonObject, ...stable },
        { model, messages, ...stable },
      ];
    }
    return [
      { model, reasoning_effort: effort, response_format: wrapSchema(schemaName, schema), messages, ...grokFirst },
      { model, reasoning_effort: effort, response_format: jsonObject, messages, ...stable },
      { model, reasoning_effort: effort, messages, ...stable },
      { model, response_format: jsonObject, messages, ...stable },
      { model, messages, ...stable },
    ];
  }

  function readContent(data) {
    const choice = data?.choices?.[0];
    const msg = choice?.message;
    if (typeof msg?.content === 'string' && msg.content.trim()) return msg.content;
    if (Array.isArray(msg?.content)) {
      const joined = msg.content
        .map((part) => (typeof part === 'string' ? part : part?.text || ''))
        .join('')
        .trim();
      if (joined) return joined;
    }
    const parts = data?.candidates?.[0]?.content?.parts;
    if (Array.isArray(parts)) {
      const joined = parts.map((p) => p?.text || '').join('').trim();
      if (joined) return joined;
    }
    return '';
  }

  async function completeGoogleNative({ messages, apiKey, model, signal, reasoningEffort }) {
    const modelName = (model || PROVIDERS.google.model).trim();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:generateContent`;
    const system = messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n');
    const user = messages.filter((m) => m.role !== 'system').map((m) => m.content).join('\n');
    const body = {
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: user }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0 },
    };
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(body),
      signal: combineSignals(signal, reasoningEffort),
    });
    const text = await res.text();
    return { res, text };
  }

  async function complete(opts) {
    const { messages, schemaName, schema, apiKey, signal } = opts;
    if (!apiKey) throw new Error('NO_API_KEY');
    const provider = PROVIDERS[opts.provider] ? opts.provider : guessProviderFromUrl(opts.baseUrl || '');
    const spec = PROVIDERS[provider];
    const base = normalizeBaseUrl(opts.baseUrl || spec.baseUrl, provider);
    const url = `${base}/chat/completions`;
    const modelName = (opts.model || spec.model).trim();
    const effort = opts.reasoningEffort || 'low';
    const bodies = buildBodies(provider, {
      model: modelName,
      effort,
      messages,
      schemaName,
      schema,
      seed: opts.seed,
    });

    let lastStatus = 0;
    let lastDetail = '';

    try {
      for (let i = 0; i < bodies.length; i++) {
        const { res, text } = await postChat(url, apiKey, bodies[i], { signal, reasoningEffort: effort });
        lastStatus = res.status;
        if (res.ok) {
          let data;
          try {
            data = JSON.parse(text);
          } catch {
            throw new Error('API 回傳不是 JSON');
          }
          const content = readContent(data);
          if (!content) throw new Error('API 回傳空白內容（若用推理模型，請把推理強度改成低）');
          return VA.schema.repairJson(content);
        }
        lastDetail = parseApiErrorBody(text, res.status);
        if (res.status !== 400) break;
      }

      if (provider === 'google' && (lastStatus === 400 || lastStatus === 404 || lastStatus === 0)) {
        const { res, text } = await completeGoogleNative({
          messages,
          apiKey,
          model: modelName,
          signal,
          reasoningEffort: effort,
        });
        lastStatus = res.status;
        if (res.ok) {
          const data = JSON.parse(text);
          const content = readContent(data);
          if (!content) throw new Error('API 回傳空白內容');
          return VA.schema.repairJson(content);
        }
        lastDetail = parseApiErrorBody(text, res.status);
      }
    } catch (e) {
      const msg = (e && e.message) || String(e);
      if (/timeout|TimeoutError/i.test(msg) || e?.name === 'TimeoutError') {
        throw new Error('請求逾時 · 請重試');
      }
      if (/Failed to fetch|NetworkError|CORS|Load failed|TypeError/i.test(msg)) {
        throw new Error(
          `無法連線到 ${spec.label}（CORS / 網路 / Base URL）。目前：${base}。可改用本機伺服器開啟，或換一家供應商。`
        );
      }
      throw e;
    }

    if (lastStatus === 401 || lastStatus === 403) {
      throw new Error(`${spec.label} API Key 無效或無權限：${lastDetail}`);
    }
    if (lastStatus === 404) {
      throw new Error(`找不到端點或模型（${modelName}）。${lastDetail}`);
    }
    if (lastStatus === 429) {
      throw new Error(`速率限制：${lastDetail}`);
    }
    throw new Error(lastDetail ? `HTTP ${lastStatus}：${lastDetail}` : `HTTP ${lastStatus}`);
  }

  async function fillGlosses(opts) {
    const { analysis } = opts;
    const P = VA.prompts;
    const lang = opts.lang || VA.langs?.currentId?.() || 'fr';
    const messages = P.usingLang(lang, () => [
      { role: 'system', content: P.fillSystem() },
      { role: 'user', content: P.fillUser(analysis) },
    ]);
    const raw = await complete({
      ...opts,
      seed: opts.seed ?? querySeed(opts.analysis?.lemma || '', lang),
      schemaName: 'athanor_fill_glosses',
      schema: P.FILL_SCHEMA,
      messages,
    });
    return raw;
  }

  async function ensureGlosses(analysis, opts) {
    if (!analysis || analysis.demo) return analysis;
    const miss = VA.schema.missingGlosses(analysis);
    if (!miss.any) return analysis;
    if (!opts?.apiKey) return analysis;
    try {
      const fill = await fillGlosses({ ...opts, analysis });
      return VA.schema.mergeGlosses(analysis, fill);
    } catch {
      return analysis;
    }
  }

  async function analyzeWord(opts) {
    const { word, forceSplit } = opts;
    const P = VA.prompts;
    const lang = opts.lang || VA.langs?.currentId?.() || 'fr';
    const messages = P.usingLang(lang, () => [
      { role: 'system', content: P.analyzeSystem() },
      { role: 'user', content: P.analyzeUser(word, { forceSplit }) },
    ]);
    const raw = await complete({
      ...opts,
      seed: opts.seed ?? querySeed(word, lang),
      schemaName: 'athanor_analyze',
      schema: P.ANALYZE_SCHEMA,
      messages,
    });
    const analysis = VA.schema.normalizeAnalysis(raw, word);
    return ensureGlosses(analysis, opts);
  }

  async function expandMorpheme(opts) {
    const { op, morph, word, analysis } = opts;
    const P = VA.prompts;
    const resolvedOp = VA.schema.normalizeOp(op);
    const lang = opts.lang || VA.langs?.currentId?.() || 'fr';
    const messages = P.usingLang(lang, () => [
      { role: 'system', content: P.expandSystem(resolvedOp) },
      { role: 'user', content: P.expandUser({ op: resolvedOp, seed: morph?.surface, morph, word, analysis }) },
    ]);
    const raw = await complete({
      ...opts,
      seed: opts.seed ?? querySeed(`${resolvedOp}|${morph?.surface || ''}|${word || ''}`, lang),
      schemaName: 'athanor_expand',
      schema: P.EXPAND_SCHEMA,
      messages,
    });
    return VA.schema.normalizeExpand(raw, resolvedOp, morph?.surface);
  }

  async function combineMorphemes(opts) {
    const { a, b, word, analysis } = opts;
    const P = VA.prompts;
    const seed = `${a?.surface || a?.form || ''} + ${b?.surface || b?.form || ''}`;
    const lang = opts.lang || VA.langs?.currentId?.() || 'fr';
    const messages = P.usingLang(lang, () => [
      { role: 'system', content: P.combineSystem() },
      { role: 'user', content: P.combineUser({ a, b, word, analysis }) },
    ]);
    const raw = await complete({
      ...opts,
      schemaName: 'athanor_expand',
      schema: P.EXPAND_SCHEMA,
      messages,
    });
    return VA.schema.normalizeExpand(raw, 'compound', seed);
  }

  VA.ai = {
    PROVIDERS,
    detectProvider,
    analyzeWord,
    expandMorpheme,
    combineMorphemes,
    ensureGlosses,
    fillGlosses,
    normalizeBaseUrl,
  };
})(typeof window !== 'undefined' ? window : globalThis);

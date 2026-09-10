/**
 * Verba Orbis — bootstrap + two-step state machine (file:// safe)
 */
(function (global) {
  const VO = global.VerbaOrbis || {};
  const { t, applyI18n } = VO.i18n;
  const S = VO.schema;
  const storage = VO.storage;
  const ai = VO.ai;
  const ui = VO.ui;

  function bootstrapConfig() {
    const cfg = window.VERBA_ORBIS_CONFIG || {};
    const s = storage.getSettings();
    const patch = {};
    if (!s.baseUrl && cfg.DEFAULT_BASE_URL) patch.baseUrl = cfg.DEFAULT_BASE_URL;
    if (!s.model && cfg.DEFAULT_MODEL) patch.model = cfg.DEFAULT_MODEL;
    if (!s.reasoningEffort && cfg.DEFAULT_REASONING_EFFORT) {
      patch.reasoningEffort = cfg.DEFAULT_REASONING_EFFORT;
    }
    if (!s.radixMultiUrl && cfg.RADIX_MULTI_URL) patch.radixMultiUrl = cfg.RADIX_MULTI_URL;
    if (Object.keys(patch).length) storage.saveSettings(patch);
  }

  const els = {};
  let generationId = 0;
  let inflight = null;
  let uiState = 'idle';
  let sourceLangMode = 'auto';
  let lastCandidates = null;
  let lastQuery = '';
  let lastDetected = 'zh';
  let lockedSense = null;
  let currentResult = null;
  let modelAtLock = '';
  let activeHistoryId = '';
  let historyFilter = '';
  let arrivedViaCache = false;

  function $(id) {
    return document.getElementById(id);
  }

  function cacheEls() {
    els.main = $('main-pane');
    els.search = $('query-input');
    els.compareBtn = $('compare-btn');
    els.status = $('status-bar');
    els.chips = $('lang-chips');
    els.langHint = $('lang-hint');
    els.senseDock = $('sense-dock');
    els.senseStage = $('sense-stage');
    els.zones = $('zones');
    els.zoneA = $('zone-a');
    els.zoneB = $('zone-b');
    els.history = $('history-list');
    els.historyFilter = $('history-filter');
    els.clearHistory = $('clear-history');
    els.historyBtn = $('history-btn');
    els.historySection = $('history-section');
    els.tocClose = $('toc-close');
    els.settingsBtn = $('settings-btn');
    els.modal = $('settings-modal');
    els.modalClose = $('settings-close');
    els.saveSettings = $('save-settings');
    els.apiKey = $('setting-api-key');
    els.baseUrl = $('setting-base-url');
    els.model = $('setting-model');
    els.reasoning = $('setting-reasoning');
    els.radixUrl = $('setting-radix-url');
    els.includeKey = $('setting-include-key');
    els.btnExport = $('btn-export');
    els.btnImport = $('btn-import');
    els.importFile = $('import-file');
    els.copyRadix = $('btn-copy-radix-key');
    els.ttsVoice = $('setting-tts-voice');
  }

  function beginGeneration(reason) {
    if (inflight) {
      try {
        inflight.controller.abort();
      } catch (_) {}
    }
    generationId += 1;
    const controller = new AbortController();
    inflight = { controller, id: generationId, reason: reason || '' };
    return { generationId, signal: controller.signal };
  }

  function isCurrent(id) {
    return id === generationId;
  }

  function creds() {
    const s = storage.getSettings();
    return {
      apiKey: storage.getApiKey(),
      baseUrl: s.baseUrl,
      model: s.model,
      reasoningEffort: s.reasoningEffort || 'low',
    };
  }

  function setBusy(busy) {
    if (els.compareBtn) els.compareBtn.disabled = !!busy;
  }

  function paintChips() {
    ui.renderLangChips(els.chips, {
      selected: sourceLangMode,
      onSelect(id) {
        sourceLangMode = id;
        paintChips();
        updateLangHint();
      },
    });
  }

  function updateLangHint() {
    if (!els.langHint) return;
    const q = els.search?.value || '';
    const detected = S.detectSourceLang(q);
    lastDetected = detected;
    const show =
      sourceLangMode === 'auto' && q.trim() && S.needsSourceHint(q, detected);
    els.langHint.classList.toggle('hidden', !show);
    els.langHint.textContent = show ? t('status.langHint') : '';
  }

  function refreshHistory() {
    let rows = storage.listHistory();
    const f = historyFilter.trim();
    if (f) {
      const n = S.normalizeQuery(f);
      rows = rows.filter(
        (r) =>
          S.normalizeQuery(r.query).includes(n) ||
          S.normalizeQuery(r.senseGloss || '').includes(n)
      );
    }
    ui.renderHistory(els.history, rows, {
      activeId: activeHistoryId,
      onSelect: loadHistoryRow,
      onDelete: deleteHistoryRow,
    });
  }

  function deleteHistoryRow(rec) {
    if (!rec || !rec.id) return;
    const q = rec.query || rec.normalized || rec.senseGloss || '';
    const msg = t('history.deleteConfirm').replace('{q}', q);
    if (!confirm(msg)) return;
    storage.deleteHistory(rec.id);
    if (activeHistoryId === rec.id) {
      beginGeneration('delete');
      activeHistoryId = '';
      lockedSense = null;
      currentResult = null;
      arrivedViaCache = false;
      if (els.senseDock) els.senseDock.innerHTML = '';
      showEmptyBoard();
    }
    ui.setStatus(els.status, t('status.deleted'), 'success');
    refreshHistory();
  }

  function persistPartial(extraResult) {
    if (!lockedSense) return;
    const result = extraResult || currentResult;
    if (!result) return;
    try {
      const rec = storage.upsertHistory({
        query: lockedSense.query,
        normalized: S.normalizeQuery(lockedSense.query),
        sourceLang: lockedSense.sourceLang,
        senseKey: lockedSense.senseKey,
        senseId: lockedSense.id,
        senseGloss: lockedSense.glossZh,
        sensePos: lockedSense.pos,
        result,
      });
      if (rec) rememberOpen(rec.id);
    } catch (e) {
      if (e && e.message === 'QUOTA') {
        ui.setStatus(els.status, t('status.quota'), 'error');
      }
    }
    refreshHistory();
  }

  function buildResult({ zoneA, zoneB, warnings, modelA, modelB }) {
    return {
      schemaVersion: 1,
      query: lockedSense.query,
      sourceLang: lockedSense.sourceLang,
      lockedSense,
      zoneA: zoneA || null,
      zoneB: zoneB || null,
      generatedAt: new Date().toISOString(),
      model: modelAtLock,
      modelA: modelA || undefined,
      modelB: modelB || undefined,
      warnings: warnings || [],
    };
  }

  function rememberOpen(id) {
    if (!id) return;
    activeHistoryId = id;
    try {
      storage.saveMeta({ lastHistoryId: id });
    } catch (_) {}
  }

  function showEmptyBoard() {
    setStage('board');
    ui.renderZoneA(els.zoneA, { cards: [] });
    ui.renderZoneB(els.zoneB, { cards: [] });
  }

  function restoreLastView() {
    const rows = storage.listHistory();
    if (!rows.length) {
      showEmptyBoard();
      return;
    }
    const want = (storage.getMeta() || {}).lastHistoryId;
    const rec = rows.find((r) => r && r.id === want) || rows[0];
    if (rec) loadHistoryRow(rec, { skipBegin: true, silent: true });
    else showEmptyBoard();
  }

  function setStage(stage) {
    if (els.main) els.main.dataset.stage = stage;
    if (stage !== 'senses' && els.senseStage) els.senseStage.innerHTML = '';
  }

  function showZones() {
    setStage('board');
  }

  function paintResult(result, { zoneBFailed } = {}) {
    currentResult = result;
    showZones();
    if (result && result.zoneA) ui.renderZoneA(els.zoneA, result.zoneA);
    if (result && result.zoneB) {
      ui.renderZoneB(els.zoneB, result.zoneB, {
        failed: !!zoneBFailed,
        onRetry: () => retryZoneB(),
      });
    } else if (zoneBFailed) {
      ui.renderZoneB(els.zoneB, null, { failed: true, onRetry: () => retryZoneB() });
    }
  }

  async function speakHeadword(word, lang, btn) {
    const apiKey = storage.getApiKey();
    if (!apiKey) {
      ui.setStatus(els.status, t('status.speakNeedKey'), 'error');
      openSettings();
      return;
    }
    const s = storage.getSettings();
    const language = (VO.tts && VO.tts.ttsLang(lang)) || lang || 'en';
    ui.setStatus(els.status, t('status.speakLoading'), '');
    ui.setSpeakBtnState(btn, 'loading');
    try {
      await VO.tts.speakWord({
        text: word,
        apiKey,
        baseUrl: s.baseUrl,
        voiceId: s.ttsVoiceId || 'helios',
        language,
      });
      ui.setSpeakBtnState(btn, 'speaking');
      ui.setStatus(els.status, '', '');
      setTimeout(() => ui.setSpeakBtnState(btn, 'idle'), 800);
    } catch (e) {
      ui.setSpeakBtnState(btn, 'idle');
      if (e && e.message === 'NO_API_KEY') {
        ui.setStatus(els.status, t('status.speakNeedKey'), 'error');
        openSettings();
        return;
      }
      ui.setStatus(els.status, `${t('status.speakFail')}: ${e && e.message ? e.message : e}`, 'error');
    }
  }

  function paintLockChip() {
    ui.renderLockedChip(els.senseDock, lockedSense, {
      onChange: changeSense,
      onRecompare: () => runZones(true),
    });
  }

  function validateQuery(raw) {
    const normalized = S.normalizeQuery(raw);
    if (!normalized) return { ok: false, msg: t('status.empty') };
    const tokens = normalized.split(' ').filter(Boolean);
    if (normalized.length > 64 || tokens.length > 12) {
      return { ok: false, msg: t('status.overlong') };
    }
    return { ok: true, normalized, long: normalized.length > 32 };
  }

  function handleError(e, fallback) {
    if (!e) {
      ui.setStatus(els.status, fallback || t('status.parseFail'), 'error');
      return;
    }
    if (e.code === 'NO_API_KEY' || e.message === 'NO_API_KEY') {
      ui.setStatus(els.status, t('status.needKey'), 'error');
      openSettings();
      return;
    }
    if (e.code === 'TIMEOUT' || e.message === 'TIMEOUT') {
      ui.setStatus(els.status, t('status.timeout'), 'error');
      return;
    }
    if (e.code === 'UNPARSEABLE' || e.message === 'UNPARSEABLE') {
      ui.setStatus(els.status, t('status.parseFail'), 'error');
      return;
    }
    ui.setStatus(els.status, e.message || fallback || t('status.parseFail'), 'error');
  }

  async function submitQuery() {
    const raw = (els.search?.value || '').trim();
    const check = validateQuery(raw);
    if (!check.ok) {
      ui.setStatus(els.status, check.msg, 'error');
      return;
    }
    const { generationId: gid, signal } = beginGeneration('submit');
    lastQuery = raw;
    lastCandidates = null;
    lockedSense = null;
    currentResult = null;
    arrivedViaCache = false;
    if (els.senseDock) els.senseDock.innerHTML = '';

    const detected = S.detectSourceLang(raw);
    lastDetected = detected;
    const effective = S.effectiveSourceLang(sourceLangMode, detected);
    const hits = storage.listByNormalized(check.normalized);
    if (hits.length === 1 && hits[0].result) {
      arrivedViaCache = true;
      loadHistoryRow(hits[0], { skipBegin: true, gid });
      return;
    }

    if (!storage.getApiKey()) {
      ui.setStatus(els.status, t('status.needKey'), 'error');
      openSettings();
      return;
    }

    uiState = 'loadingSenses';
    setBusy(true);
    ui.setLoading(els.status, true, t('status.listing'));
    if (check.long) {
      /* keep listing as primary */
    }
    try {
      const c = creds();
      const { list } = await ai.listSenses({
        query: raw,
        sourceLang: sourceLangMode,
        detectedSourceLang: detected,
        apiKey: c.apiKey,
        baseUrl: c.baseUrl,
        model: c.model,
        reasoningEffort: c.reasoningEffort,
        signal,
      });
      if (!isCurrent(gid)) return;
      if (!list.candidates.length) {
        uiState = 'senses';
        setStage('senses');
        ui.setStatus(els.status, t('status.emptySenses'), 'error');
        if (els.senseStage) {
          els.senseStage.innerHTML = `<div class="picker-head">${t('status.emptySenses')}</div>
            <button type="button" class="btn-primary" id="retry-senses">${t('picker.retry')}</button>`;
        }
        $('retry-senses')?.addEventListener('click', submitQuery);
        return;
      }
      lastCandidates = list.candidates;
      uiState = 'senses';
      const highlight =
        hits.length >= 2
          ? hits.map((h) => h.senseKey).find((k) => list.candidates.some((c) => c.senseKey === k))
          : '';
      ui.setStatus(els.status, '');
      setStage('senses');
      ui.renderSensePicker(els.senseStage, list.candidates, {
        highlightKey: highlight,
        single: list.candidates.length === 1,
        onPick: (cand) => lockSense(cand, { query: raw, sourceLang: effective }),
      });
    } catch (e) {
      if (!isCurrent(gid)) return;
      uiState = 'error';
      handleError(e);
    } finally {
      if (isCurrent(gid)) setBusy(false);
    }
  }

  function lockSense(cand, ctx) {
    const { generationId: gid } = beginGeneration('lock');
    const effective = ctx.sourceLang || S.effectiveSourceLang(sourceLangMode, lastDetected);
    lockedSense = {
      id: cand.id,
      senseKey: cand.senseKey,
      query: ctx.query,
      sourceLang: effective,
      pos: cand.pos,
      glossZh: cand.glossZh,
      domain: cand.domain,
      headwordHint: cand.headwordHint || ctx.query,
    };
    modelAtLock = storage.getSettings().model;
    arrivedViaCache = false;
    paintLockChip();
    uiState = 'locked';
    runZones(false, gid);
  }

  async function runZones(force, existingGid) {
    if (!lockedSense) return;
    const pack = existingGid
      ? { generationId: existingGid, signal: inflight && inflight.controller.signal }
      : beginGeneration(force ? 'recompare' : 'zones');
    const gid = pack.generationId;
    const signal = pack.signal;
    if (!storage.getApiKey()) {
      ui.setStatus(els.status, t('status.needKey'), 'error');
      openSettings();
      return;
    }

    const cached = !force && storage.getBySense(S.normalizeQuery(lockedSense.query), lockedSense.senseKey);
    if (!force && cached && cached.result && cached.result.zoneA && cached.result.zoneB) {
      currentResult = cached.result;
      lockedSense = cached.result.lockedSense || lockedSense;
      rememberOpen(cached.id);
      paintLockChip();
      paintResult(cached.result);
      ui.setStatus(els.status, t('status.cached'), 'success');
      uiState = 'ready';
      refreshHistory();
      return;
    }

    showZones();
    uiState = 'loadingA';
    setBusy(true);
    ui.setLoading(els.status, true, t('status.writingA'));
    ui.renderZoneSkeleton(els.zoneA, 'A');
    els.zoneB.innerHTML = '';

    const c = creds();
    const warnings = [];
    let zoneA = (currentResult && currentResult.zoneA) || null;
    let zoneB = null;
    let modelA;
    let modelB;

    try {
      const a = await ai.generateZoneA({
        query: lockedSense.query,
        lockedSense,
        apiKey: c.apiKey,
        baseUrl: c.baseUrl,
        model: c.model,
        reasoningEffort: c.reasoningEffort,
        signal,
      });
      if (!isCurrent(gid)) return;
      zoneA = a.zoneA;
      modelA = a.model;
      warnings.push(...(a.warnings || []));
      currentResult = buildResult({ zoneA, zoneB: null, warnings, modelA });
      ui.renderZoneA(els.zoneA, zoneA);
      persistPartial(currentResult);
      uiState = 'readyA';
    } catch (e) {
      if (!isCurrent(gid)) return;
      uiState = 'error';
      setBusy(false);
      handleError(e);
      return;
    }

    uiState = 'loadingB';
    ui.setLoading(els.status, true, t('status.writingB'));
    ui.renderZoneSkeleton(els.zoneB, 'B');
    try {
      const b = await ai.generateZoneB({
        query: lockedSense.query,
        lockedSense,
        zoneA,
        zoneADigest: S.digestZoneA(zoneA),
        apiKey: c.apiKey,
        baseUrl: c.baseUrl,
        model: c.model,
        reasoningEffort: c.reasoningEffort,
        signal,
      });
      if (!isCurrent(gid)) return;
      zoneB = b.zoneB;
      modelB = b.model;
      warnings.push(...(b.warnings || []));
      currentResult = buildResult({ zoneA, zoneB, warnings, modelA, modelB });
      paintResult(currentResult);
      persistPartial(currentResult);
      ui.setStatus(els.status, t('status.saved'), 'success');
      uiState = 'ready';
    } catch (e) {
      if (!isCurrent(gid)) return;
      uiState = 'readyA';
      currentResult = buildResult({
        zoneA,
        zoneB: currentResult && currentResult.zoneB,
        warnings: warnings.concat(['retry:zoneB']),
        modelA,
      });
      persistPartial(currentResult);
      paintResult(currentResult, { zoneBFailed: true });
      handleError(e, t('status.zoneBFail'));
    } finally {
      if (isCurrent(gid)) setBusy(false);
    }
  }

  async function retryZoneB() {
    if (!lockedSense || !currentResult || !currentResult.zoneA) return;
    const { generationId: gid, signal } = beginGeneration('retryB');
    const c = creds();
    uiState = 'loadingB';
    setBusy(true);
    ui.setLoading(els.status, true, t('status.writingB'));
    ui.renderZoneSkeleton(els.zoneB, 'B');
    try {
      const b = await ai.generateZoneB({
        query: lockedSense.query,
        lockedSense,
        zoneA: currentResult.zoneA,
        zoneADigest: S.digestZoneA(currentResult.zoneA),
        apiKey: c.apiKey,
        baseUrl: c.baseUrl,
        model: c.model,
        reasoningEffort: c.reasoningEffort,
        signal,
      });
      if (!isCurrent(gid)) return;
      currentResult = buildResult({
        zoneA: currentResult.zoneA,
        zoneB: b.zoneB,
        warnings: (currentResult.warnings || []).concat(b.warnings || []),
        modelA: currentResult.modelA,
        modelB: b.model,
      });
      paintResult(currentResult);
      persistPartial(currentResult);
      ui.setStatus(els.status, t('status.saved'), 'success');
      uiState = 'ready';
    } catch (e) {
      if (!isCurrent(gid)) return;
      paintResult(currentResult, { zoneBFailed: true });
      handleError(e, t('status.zoneBFail'));
    } finally {
      if (isCurrent(gid)) setBusy(false);
    }
  }

  function changeSense() {
    beginGeneration('changeSense');
    lockedSense = null;
    currentResult = null;
    if (els.senseDock) els.senseDock.innerHTML = '';
    ui.renderZoneA(els.zoneA, null);
    ui.renderZoneB(els.zoneB, null);
    if (lastCandidates && lastCandidates.length) {
      const effective = S.effectiveSourceLang(sourceLangMode, lastDetected);
      setStage('senses');
      ui.renderSensePicker(els.senseStage, lastCandidates, {
        single: lastCandidates.length === 1,
        onPick: (cand) => lockSense(cand, { query: lastQuery, sourceLang: effective }),
      });
      uiState = 'senses';
      ui.setStatus(els.status, '');
      return;
    }
    submitQuery();
  }

  function loadHistoryRow(rec, { skipBegin, gid, silent } = {}) {
    if (!rec) return;
    if (!skipBegin) beginGeneration('history');
    lastQuery = rec.query;
    if (els.search) els.search.value = rec.query;
    lockedSense = (rec.result && rec.result.lockedSense) || {
      id: rec.senseId,
      senseKey: rec.senseKey,
      query: rec.query,
      sourceLang: rec.sourceLang,
      pos: rec.sensePos,
      glossZh: rec.senseGloss,
      domain: '日常',
      headwordHint: rec.query,
    };
    modelAtLock = (rec.result && rec.result.model) || storage.getSettings().model;
    currentResult = rec.result;
    rememberOpen(rec.id);
    arrivedViaCache = true;
    lastCandidates = null;
    paintLockChip();
    paintResult(rec.result || {});
    if (!silent) ui.setStatus(els.status, t('status.cached'), 'success');
    uiState = rec.result && rec.result.zoneB ? 'ready' : 'readyA';
    if (rec.result && rec.result.zoneA && !rec.result.zoneB) {
      paintResult(rec.result, { zoneBFailed: true });
    }
    refreshHistory();
  }

  function openToc() {
    els.historySection?.classList.remove('hidden');
  }

  function closeToc() {
    els.historySection?.classList.add('hidden');
  }

  function toggleToc() {
    if (!els.historySection) return;
    els.historySection.classList.toggle('hidden');
  }

  function openSettings() {
    const s = storage.getSettings();
    if (els.apiKey) els.apiKey.value = storage.getApiKey();
    if (els.baseUrl) els.baseUrl.value = s.baseUrl || '';
    if (els.model) els.model.value = s.model || '';
    if (els.reasoning) els.reasoning.value = s.reasoningEffort || 'low';
    if (els.radixUrl) els.radixUrl.value = s.radixMultiUrl || '';
    if (els.ttsVoice) els.ttsVoice.value = s.ttsVoiceId || 'helios';
    if (els.includeKey) els.includeKey.checked = false;
    els.modal?.classList.remove('hidden');
    document.body.classList.add('modal-open');
  }

  function closeSettings() {
    els.modal?.classList.add('hidden');
    document.body.classList.remove('modal-open');
  }

  function saveSettingsFromForm() {
    storage.saveApiKey(els.apiKey?.value || '');
    storage.saveSettings({
      baseUrl: (els.baseUrl?.value || '').trim() || 'https://api.x.ai/v1',
      model: (els.model?.value || '').trim() || 'grok-4.6',
      reasoningEffort: els.reasoning?.value || 'low',
      radixMultiUrl: (els.radixUrl?.value || '').trim(),
      ttsVoiceId: (els.ttsVoice?.value || '').trim() || 'helios',
    });
    closeSettings();
    ui.setStatus(els.status, t('status.settingsSaved'), 'success');
  }

  function bindEvents() {
    els.zones?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action="speak"]');
      if (btn) {
        if (btn.disabled) return;
        e.preventDefault();
        e.stopPropagation();
        const word = btn.getAttribute('data-word') || '';
        const lang = btn.getAttribute('data-lang') || 'en';
        if (!word) return;
        speakHeadword(word, lang, btn);
        return;
      }
      if (e.target.closest('a')) return;
      const card = e.target.closest('.lang-card');
      if (!ui.isFlippableCard(card)) return;
      ui.toggleCardFlip(card);
    });

    els.zones?.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      if (e.target.closest('[data-action="speak"], a, button')) return;
      const card = e.target.closest('.lang-card');
      if (!ui.isFlippableCard(card)) return;
      e.preventDefault();
      ui.toggleCardFlip(card);
    });

    els.compareBtn?.addEventListener('click', submitQuery);
    els.search?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        submitQuery();
      }
    });
    els.search?.addEventListener('input', () => {
      updateLangHint();
      if (lockedSense) {
        const cur = S.normalizeQuery(els.search.value);
        const locked = S.normalizeQuery(lockedSense.query);
        if (cur && cur !== locked) {
          beginGeneration('edit');
          lockedSense = null;
          currentResult = null;
          if (els.senseDock) els.senseDock.innerHTML = '';
          uiState = 'idle';
        }
      }
    });

    function cardFromEvent(e) {
      const node = document.elementFromPoint(e.clientX, e.clientY);
      return node && node.closest ? node.closest('.lang-card[data-lang]') : null;
    }

    function clearDropTarget() {
      document.querySelectorAll('.lang-card.drop-target').forEach((el) => el.classList.remove('drop-target'));
      document.body.classList.remove('card-dragging');
    }

    function applyBgToLang(lang, dataUrl) {
      try {
        storage.setCardBg(lang, dataUrl);
        ui.applyCardBackgrounds(els.zones);
        ui.setStatus(els.status, t('crop.saved'), 'success');
      } catch (err) {
        if (err && err.message === 'QUOTA') {
          ui.setStatus(els.status, t('status.quota'), 'error');
        } else {
          ui.setStatus(els.status, err && err.message ? err.message : t('status.parseFail'), 'error');
        }
      }
    }

    function clearBgForLang(lang) {
      storage.clearCardBg(lang);
      ui.applyCardBackgrounds(els.zones);
      ui.setStatus(els.status, t('crop.cleared'), 'success');
    }

    function openCropForCard(card, file) {
      if (!card || !file || !VO.crop) return;
      if (!/^image\//.test(file.type || '')) {
        ui.setStatus(els.status, t('crop.badFile'), 'error');
        return;
      }
      const lang = card.getAttribute('data-lang');
      const aspect = card.clientWidth && card.clientHeight ? card.clientWidth / card.clientHeight : 1.15;
      VO.crop.open({
        file,
        lang,
        aspect,
        langLabel: t('langFull.' + lang),
        onApply: applyBgToLang,
        onClear: clearBgForLang,
      });
    }

    ['dragenter', 'dragover'].forEach((type) => {
      els.zones?.addEventListener(type, (e) => {
        const dt = e.dataTransfer;
        if (!dt || !Array.from(dt.types || []).includes('Files')) return;
        e.preventDefault();
        e.stopPropagation();
        dt.dropEffect = 'copy';
        document.body.classList.add('card-dragging');
        const card = cardFromEvent(e);
        document.querySelectorAll('.lang-card.drop-target').forEach((el) => {
          if (el !== card) el.classList.remove('drop-target');
        });
        if (card) card.classList.add('drop-target');
      });
    });

    els.zones?.addEventListener('dragleave', (e) => {
      if (!els.zones.contains(e.relatedTarget)) clearDropTarget();
    });

    els.zones?.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const card = document.querySelector('.lang-card.drop-target') || cardFromEvent(e);
      clearDropTarget();
      const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (!file) return;
      openCropForCard(card, file);
    });

    window.addEventListener('dragend', clearDropTarget);
    window.addEventListener('drop', (e) => {
      if (els.zones && els.zones.contains(e.target)) return;
      if (e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files')) {
        e.preventDefault();
      }
      clearDropTarget();
    });
    window.addEventListener('dragover', (e) => {
      if (e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files')) {
        e.preventDefault();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (VO.crop && VO.crop.isOpen()) {
          VO.crop.close();
          return;
        }
        if (els.modal && !els.modal.classList.contains('hidden')) {
          closeSettings();
          return;
        }

      }
      if (e.key === '/' && document.activeElement !== els.search && !e.ctrlKey && !e.metaKey) {
        const tag = document.activeElement?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        e.preventDefault();
        els.search?.focus();
      }
    });

    els.settingsBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      openSettings();
    });
    els.modalClose?.addEventListener('click', closeSettings);
    els.modal?.addEventListener('click', (e) => {
      if (e.target === els.modal) closeSettings();
    });
    els.modal?.querySelector('.modal')?.addEventListener('click', (e) => e.stopPropagation());
    els.saveSettings?.addEventListener('click', saveSettingsFromForm);

    els.copyRadix?.addEventListener('click', () => {
      const r = storage.copyRadixApiKey();
      if (r.ok) {
        if (els.apiKey) els.apiKey.value = storage.getApiKey();
        ui.setStatus(els.status, t('status.copiedKey'), 'success');
      } else {
        ui.setStatus(els.status, t('status.noRadixKey'), 'error');
      }
    });

    els.btnExport?.addEventListener('click', () => {
      const data = storage.exportData({ includeApiKey: !!(els.includeKey && els.includeKey.checked) });
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `verba-orbis-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
      ui.setStatus(els.status, t('status.exportOk'), 'success');
    });

    els.btnImport?.addEventListener('click', () => els.importFile?.click());
    els.importFile?.addEventListener('change', async () => {
      const file = els.importFile.files && els.importFile.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const payload = JSON.parse(text);
        storage.importData(payload);
        refreshHistory();
        if (els.apiKey) els.apiKey.value = storage.getApiKey();
        ui.setStatus(els.status, t('status.importOk'), 'success');
      } catch (e) {
        if (e && e.message === 'WRONG_APP') {
          ui.setStatus(els.status, t('status.wrongImport'), 'error');
        } else {
          ui.setStatus(els.status, e.message || t('status.parseFail'), 'error');
        }
      }
      els.importFile.value = '';
    });

    els.clearHistory?.addEventListener('click', () => {
      if (!confirm('清空全部查詢紀錄？')) return;
      storage.clearHistory();
      try {
        storage.saveMeta({ lastHistoryId: '' });
      } catch (_) {}
      activeHistoryId = '';
      lockedSense = null;
      currentResult = null;
      if (els.senseDock) els.senseDock.innerHTML = '';
      showEmptyBoard();
      refreshHistory();
    });
    els.historyFilter?.addEventListener('input', () => {
      historyFilter = els.historyFilter.value || '';
      refreshHistory();
    });
  }

  function init() {
    bootstrapConfig();
    cacheEls();
    applyI18n(document);
    paintChips();
    bindEvents();
    restoreLastView();
    refreshHistory();
    if (VO.crop) VO.crop.bind();
    const fails = S.selfCheckDetect();
    if (fails.length) console.warn('Orbis detect fixtures', fails);
    window.__VERBA_ORBIS_READY__ = true;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof window !== 'undefined' ? window : globalThis);

/**
 * Verba Orbis localStorage — orbis.* only (file:// safe)
 */
(function (global) {
  const VO = (global.VerbaOrbis = global.VerbaOrbis || {});

  const KEYS = {
    settings: 'orbis.settings',
    apiKey: 'orbis.apiKey',
    history: 'orbis.history',
    meta: 'orbis.meta',
    cardBgs: 'orbis.cardBgs',
  };

  const DEFAULT_SETTINGS = {
    locale: 'zh-TW',
    baseUrl: 'https://api.x.ai/v1',
    model: 'grok-4.6',
    reasoningEffort: 'low',
    radixMultiUrl: '',
    ttsVoiceId: 'helios',
    historyCap: null,
  };

  function schema() {
    return VO.schema;
  }

  function safeParse(raw, fallback) {
    try {
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function makeId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return `id_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }

  function getSettings() {
    const stored = safeParse(localStorage.getItem(KEYS.settings), {});
    return { ...DEFAULT_SETTINGS, ...stored };
  }

  function saveSettings(partial) {
    const next = { ...getSettings(), ...partial };
    try {
      localStorage.setItem(KEYS.settings, JSON.stringify(next));
    } catch (e) {
      if (isQuota(e)) throw new Error('QUOTA');
      throw e;
    }
    return next;
  }

  function getApiKey() {
    return localStorage.getItem(KEYS.apiKey) || '';
  }

  function saveApiKey(key) {
    const v = String(key || '').trim();
    if (v) localStorage.setItem(KEYS.apiKey, v);
    else localStorage.removeItem(KEYS.apiKey);
  }

  function copyRadixApiKey() {
    const src = localStorage.getItem('radix-multi.apiKey') || '';
    if (!src.trim()) return { ok: false, reason: 'empty' };
    saveApiKey(src.trim());
    return { ok: true };
  }

  function getMeta() {
    return safeParse(localStorage.getItem(KEYS.meta), {});
  }

  function saveMeta(partial) {
    const next = { ...getMeta(), ...partial };
    localStorage.setItem(KEYS.meta, JSON.stringify(next));
    return next;
  }

  function isQuota(e) {
    return e && (e.name === 'QuotaExceededError' || e.code === 22 || /quota/i.test(e.message || ''));
  }

  function loadHistory() {
    const list = safeParse(localStorage.getItem(KEYS.history), []);
    return Array.isArray(list) ? list : [];
  }

  function persistHistory(list) {
    try {
      localStorage.setItem(KEYS.history, JSON.stringify(list));
    } catch (e) {
      if (isQuota(e)) throw new Error('QUOTA');
      throw e;
    }
  }

  function historyKey(normalized, senseKey) {
    return `${normalized}::${senseKey}`;
  }

  function listHistory() {
    return loadHistory().slice().sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
  }

  function listByNormalized(normalized) {
    const n = String(normalized || '');
    return loadHistory().filter((r) => r && r.normalized === n);
  }

  function getBySense(normalized, senseKey) {
    const k = historyKey(normalized, senseKey);
    return loadHistory().find((r) => r && historyKey(r.normalized, r.senseKey) === k) || null;
  }

  function mergeResult(prevResult, nextResult) {
    const prev = prevResult && typeof prevResult === 'object' ? prevResult : {};
    const next = nextResult && typeof nextResult === 'object' ? nextResult : {};
    const warnings = Array.isArray(next.warnings) ? next.warnings.slice() : [];
    let zoneA = next.zoneA != null ? next.zoneA : prev.zoneA || null;
    let zoneB = next.zoneB;
    if (zoneB == null && prev.zoneB) {
      zoneB = prev.zoneB;
      if (!warnings.includes('kept-prior-zoneB')) warnings.push('kept-prior-zoneB');
    }
    if (zoneA == null && prev.zoneA) zoneA = prev.zoneA;
    return {
      schemaVersion: 1,
      query: next.query || prev.query || '',
      sourceLang: next.sourceLang || prev.sourceLang || '',
      lockedSense: next.lockedSense || prev.lockedSense || null,
      zoneA,
      zoneB: zoneB || null,
      generatedAt: next.generatedAt || prev.generatedAt || new Date().toISOString(),
      model: next.model || prev.model || '',
      modelA: next.modelA || prev.modelA,
      modelB: next.modelB || prev.modelB,
      warnings,
    };
  }

  function upsertHistory(record) {
    if (!record || !record.normalized || !record.senseKey) return null;
    const list = loadHistory();
    const k = historyKey(record.normalized, record.senseKey);
    const idx = list.findIndex((r) => r && historyKey(r.normalized, r.senseKey) === k);
    const now = new Date().toISOString();
    if (idx >= 0) {
      const prev = list[idx];
      const merged = {
        ...prev,
        ...record,
        id: prev.id,
        createdAt: prev.createdAt || now,
        updatedAt: now,
        result: mergeResult(prev.result, record.result),
      };
      list[idx] = merged;
      persistHistory(list);
      return merged;
    }
    const created = {
      id: record.id || makeId(),
      query: record.query || '',
      normalized: record.normalized,
      sourceLang: record.sourceLang || '',
      senseKey: record.senseKey,
      senseId: record.senseId || '',
      senseGloss: record.senseGloss || '',
      sensePos: record.sensePos || '',
      createdAt: now,
      updatedAt: now,
      result: record.result || null,
    };
    list.push(created);
    persistHistory(list);
    return created;
  }

  function deleteHistory(id) {
    const next = loadHistory().filter((r) => r && r.id !== id);
    persistHistory(next);
    const meta = getMeta();
    if (meta.lastHistoryId === id) {
      try {
        saveMeta({ lastHistoryId: '' });
      } catch (_) {}
    }
    return next;
  }

  function clearHistory() {
    persistHistory([]);
  }

  function exportData({ includeApiKey } = {}) {
    const settings = getSettings();
    return {
      app: 'verba-orbis',
      version: 1,
      exportedAt: new Date().toISOString(),
      settings: {
        locale: settings.locale,
        baseUrl: settings.baseUrl,
        model: settings.model,
        reasoningEffort: settings.reasoningEffort,
        radixMultiUrl: settings.radixMultiUrl,
        historyCap: settings.historyCap,
      },
      apiKey: includeApiKey ? getApiKey() : '',
      history: loadHistory(),
    };
  }

  function importData(payload) {
    if (!payload || typeof payload !== 'object') throw new Error('INVALID');
    if (payload.app === 'verba-radix-multi') throw new Error('WRONG_APP');
    if (payload.app && payload.app !== 'verba-orbis') throw new Error('WRONG_APP');
    if (payload.settings && typeof payload.settings === 'object') {
      const { apiKey: _drop, ...rest } = payload.settings;
      saveSettings(rest);
    }
    if (payload.apiKey && String(payload.apiKey).trim()) {
      saveApiKey(payload.apiKey);
    }
    if (Array.isArray(payload.history)) {
      persistHistory(payload.history);
    }
  }

  const CARD_BG_LANGS = ['zh', 'ko', 'ja', 'en', 'de', 'es', 'fr', 'it', 'la'];

  function getCardBgs() {
    const raw = safeParse(localStorage.getItem(KEYS.cardBgs), {});
    return raw && typeof raw === 'object' ? raw : {};
  }

  function getCardBg(lang) {
    const map = getCardBgs();
    const url = map[lang];
    return typeof url === 'string' && url.indexOf('data:image/') === 0 ? url : '';
  }

  function setCardBg(lang, dataUrl) {
    if (!CARD_BG_LANGS.includes(lang)) return getCardBgs();
    const next = { ...getCardBgs() };
    if (dataUrl) next[lang] = dataUrl;
    else delete next[lang];
    try {
      localStorage.setItem(KEYS.cardBgs, JSON.stringify(next));
    } catch (e) {
      if (isQuota(e)) throw new Error('QUOTA');
      throw e;
    }
    return next;
  }

  function clearCardBg(lang) {
    return setCardBg(lang, '');
  }

  function radixHref(lang, headword) {
    const settings = getSettings();
    const cfg = global.VERBA_ORBIS_CONFIG || {};
    const base = settings.radixMultiUrl || cfg.RADIX_MULTI_URL || '';
    if (!base || !headword || lang === 'zh' || lang === 'la') return '';
    try {
      const u = new URL(base, typeof location !== 'undefined' ? location.href : 'https://example.invalid/');
      u.searchParams.set('lang', lang);
      u.searchParams.set('q', headword);
      return u.toString();
    } catch {
      return '';
    }
  }

  VO.storage = {
    KEYS,
    DEFAULT_SETTINGS,
    makeId,
    getSettings,
    saveSettings,
    getApiKey,
    saveApiKey,
    copyRadixApiKey,
    getMeta,
    saveMeta,
    listHistory,
    listByNormalized,
    getBySense,
    upsertHistory,
    deleteHistory,
    clearHistory,
    exportData,
    importData,
    getCardBgs,
    getCardBg,
    setCardBg,
    clearCardBg,
    radixHref,
    normalizeQuery(q) {
      return schema().normalizeQuery(q);
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);

(function (global) {
  const VA = (global.VerbaAthanor = global.VerbaAthanor || {});
  const S = () => VA.schema;

  const KEYS = {
    settings: 'athanor.settings',
    apiKey: 'athanor.apiKey',
    keys: 'athanor.keys',
    history: 'athanor.history',
    cabinet: 'athanor.cabinet',
    meta: 'athanor.meta',
  };

  const DEFAULT_SETTINGS = {
    locale: 'zh-TW',
    provider: 'grok',
    baseUrl: 'https://api.x.ai/v1',
    model: 'grok-4.6',
    reasoningEffort: 'low',
    clickSpeak: true,
    ttsEngine: 'browser',
    lang: 'fr',
    ambientOn: true,
    sfxOn: true,
    ambientVol: 0.55,
    sfxVol: 0.55,
    fontScale: 1,
  };

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

  function loadSettings() {
    const stored = safeParse(localStorage.getItem(KEYS.settings), {});
    const merged = { ...DEFAULT_SETTINGS, ...stored };
    if (stored.fontScaleV !== 2) {
      const old = Number(stored.fontScale);
      if (Number.isFinite(old) && Math.abs(old - 1) > 0.02) {
        merged.fontScale = Math.min(1.5, Math.max(0.8, Math.round((old / 1.3) * 20) / 20));
      } else {
        merged.fontScale = 1;
      }
      merged.fontScaleV = 2;
      localStorage.setItem(KEYS.settings, JSON.stringify(merged));
    } else {
      const n = Number(merged.fontScale);
      merged.fontScale = Number.isFinite(n) ? Math.min(1.5, Math.max(0.8, n)) : 1;
    }
    return merged;
  }

  function saveSettings(next) {
    const merged = { ...loadSettings(), ...next };
    localStorage.setItem(KEYS.settings, JSON.stringify(merged));
    return merged;
  }

  function getKeys() {
    const bag = safeParse(localStorage.getItem(KEYS.keys), {});
    const legacy = localStorage.getItem(KEYS.apiKey) || '';
    if (legacy && !bag.grok) bag.grok = legacy;
    return bag;
  }

  function saveKeys(bag) {
    localStorage.setItem(KEYS.keys, JSON.stringify(bag));
    if (bag.grok) localStorage.setItem(KEYS.apiKey, bag.grok);
    else localStorage.removeItem(KEYS.apiKey);
    return bag;
  }

  function getApiKey(provider) {
    const p = provider || loadSettings().provider || 'grok';
    const bag = getKeys();
    return (bag[p] || '').trim();
  }

  function setApiKey(key, provider) {
    const p = provider || loadSettings().provider || 'grok';
    const bag = getKeys();
    const v = String(key || '').trim();
    if (v) bag[p] = v;
    else delete bag[p];
    saveKeys(bag);
    return v;
  }

  function copyKeyFromRadix() {
    const candidates = ['radix-multi.apiKey', 'radix-fr.apiKey', 'orbis.apiKey', 'radix.apiKey'];
    for (const k of candidates) {
      const v = (localStorage.getItem(k) || '').trim();
      if (v) {
        setApiKey(v, 'grok');
        return { ok: true, from: k };
      }
    }
    return { ok: false };
  }

  function langId() {
    return loadSettings().lang || 'fr';
  }

  function migrateLangBuckets() {
    const oldH = localStorage.getItem(KEYS.history);
    if (oldH && !localStorage.getItem(KEYS.history + '.fr')) {
      localStorage.setItem(KEYS.history + '.fr', oldH);
    }
    const oldC = localStorage.getItem(KEYS.cabinet);
    if (oldC && !localStorage.getItem(KEYS.cabinet + '.fr')) {
      localStorage.setItem(KEYS.cabinet + '.fr', oldC);
    }
  }

  function historyKey(lang) {
    return KEYS.history + '.' + (lang || langId());
  }

  function cabinetKey(lang) {
    return KEYS.cabinet + '.' + (lang || langId());
  }

  function loadHistory(lang) {
    migrateLangBuckets();
    return safeParse(localStorage.getItem(historyKey(lang)), []);
  }

  function saveHistory(list, lang) {
    localStorage.setItem(historyKey(lang), JSON.stringify(list));
    return list;
  }

  function upsertHistory(analysis, lang) {
    const normalized = S().normalizeQuery(analysis.lemma || analysis.word || analysis.query);
    if (!normalized) return loadHistory(lang);
    const now = new Date().toISOString();
    const list = loadHistory(lang);
    const idx = list.findIndex((row) => row.normalized === normalized);
    const row = {
      id: idx >= 0 ? list[idx].id : makeId(),
      query: analysis.query || analysis.word,
      normalized,
      lemma: analysis.lemma || analysis.word,
      glossZh: analysis.glossZh || '',
      pos: analysis.pos || '',
      createdAt: idx >= 0 ? list[idx].createdAt : now,
      updatedAt: now,
      analysis,
    };
    if (idx >= 0) list.splice(idx, 1);
    list.unshift(row);
    return saveHistory(list, lang);
  }

  function getHistoryByNormalized(normalized, lang) {
    return loadHistory(lang).find((row) => row.normalized === normalized) || null;
  }

  function removeHistory(normalized) {
    const key = S().normalizeQuery(normalized);
    if (!key) return loadHistory();
    return saveHistory(loadHistory().filter((row) => row.normalized !== key));
  }

  function clearHistory(lang) {
    saveHistory([], lang);
  }

  function clearAllHistory() {
    const ids = (VA.langs?.list?.() || []).map((p) => p.id);
    const langs = ids.length ? ids : ['fr', 'en', 'ja', 'ko'];
    langs.forEach((id) => clearHistory(id));
  }

  function historyCount(lang) {
    return loadHistory(lang).length;
  }

  function loadCabinet(lang) {
    migrateLangBuckets();
    return safeParse(localStorage.getItem(cabinetKey(lang)), []);
  }

  function saveCabinet(list, lang) {
    localStorage.setItem(cabinetKey(lang), JSON.stringify(list));
    return list;
  }

  function collectMorphemes(analysis, lang) {
    const cabinet = loadCabinet(lang);
    const added = [];
    const now = new Date().toISOString();
    for (const m of analysis.morphemes || []) {
      const id = m.id || S().mintMorphId(m.surface, m.kind);
      let row = cabinet.find((x) => x.id === id);
      if (!row) {
        row = {
          id,
          surface: m.surface,
          kind: m.kind,
          meaningZh: m.meaningZh,
          meaningFr: m.meaningFr || '',
          origin: m.origin,
          originForm: m.originForm || '',
          originPath: m.originPath || '',
          noteZh: m.noteZh || '',
          firstSeen: now,
          count: 0,
          words: [],
        };
        cabinet.unshift(row);
        added.push(row);
      }
      row.count = (row.count || 0) + 1;
      row.updatedAt = now;
      if (m.originPath && !row.originPath) row.originPath = m.originPath;
      if (m.originForm && !row.originForm) row.originForm = m.originForm;
      if (m.noteZh && !row.noteZh) row.noteZh = m.noteZh;
      const lemma = analysis.lemma || analysis.word;
      if (lemma && !row.words.includes(lemma)) row.words.push(lemma);
      if (row.words.length > 12) row.words = row.words.slice(-12);
    }
    saveCabinet(cabinet, lang);
    return { cabinet, added };
  }

  function bootstrapConfig() {
    const cfg = global.VERBA_ATHANOR_CONFIG || {};
    const s = loadSettings();
    const patch = {};
    if (!s.baseUrl && cfg.DEFAULT_BASE_URL) patch.baseUrl = cfg.DEFAULT_BASE_URL;
    if (!s.model && cfg.DEFAULT_MODEL) patch.model = cfg.DEFAULT_MODEL;
    if (!s.reasoningEffort && cfg.DEFAULT_REASONING_EFFORT) {
      patch.reasoningEffort = cfg.DEFAULT_REASONING_EFFORT;
    }
    if (Object.keys(patch).length) return saveSettings(patch);
    if (cfg.DEFAULT_BASE_URL && s.baseUrl === DEFAULT_SETTINGS.baseUrl) {
      /* keep */
    }
    return s;
  }

  VA.storage = {
    KEYS,
    DEFAULT_SETTINGS,
    makeId,
    loadSettings,
    saveSettings,
    getKeys,
    getApiKey,
    setApiKey,
    copyKeyFromRadix,
    loadHistory,
    upsertHistory,
    getHistoryByNormalized,
    removeHistory,
    clearHistory,
    clearAllHistory,
    historyCount,
    loadCabinet,
    collectMorphemes,
    bootstrapConfig,
  };
})(typeof window !== 'undefined' ? window : globalThis);

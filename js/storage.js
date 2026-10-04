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
      loans: idx >= 0 ? list[idx].loans : undefined,
    };
    if (!row.loans) delete row.loans;
    if (idx >= 0) list.splice(idx, 1);
    list.unshift(row);
    return saveHistory(list, lang);
  }

  function saveLoans(lemma, lang, surface, items) {
    const normalized = normFor(lang, lemma);
    if (!normalized) return null;
    const list = loadHistory(lang);
    const idx = list.findIndex((row) => row.normalized === normalized);
    if (idx < 0) return null;
    const key = S().bareForm(surface) || String(surface || '');
    if (!key) return null;
    const kept = (Array.isArray(items) ? items : []).slice(0, 10).map((item) => ({
      word: String(item?.word || '').trim(),
      kind: String(item?.kind || 'loan'),
      pos: String(item?.pos || ''),
      glossZh: String(item?.glossZh || ''),
      linkZh: String(item?.linkZh || ''),
      era: String(item?.era || 'ModE'),
    })).filter((item) => item.word);
    const row = list[idx];
    row.loans = { ...(row.loans || {}), [key]: { surface: String(surface || ''), items: kept } };
    row.updatedAt = new Date().toISOString();
    saveHistory(list, lang);
    return row.loans[key];
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

  const BACKUP_TYPE = 'verba-athanor-backup';
  const ANALYSIS_KEYS = ['query', 'word', 'lemma', 'ipa', 'pos', 'gender', 'glossZh', 'glossFr', 'alchNoteZh'];
  const MORPH_KEYS = ['surface', 'kind', 'meaningZh', 'meaningFr', 'origin', 'originForm', 'originPath', 'noteZh'];
  const PATH_KEYS = ['era', 'lang', 'form', 'glossZh', 'via', 'noteZh', 'certainty'];
  const ATTESTED_KEYS = ['year', 'era', 'form', 'whereZh', 'sourceZh', 'author', 'work', 'certainty'];
  const HISTORY_KEYS = ['query', 'lemma', 'glossZh', 'pos'];
  const CABINET_KEYS = ['surface', 'kind', 'meaningZh', 'meaningFr', 'origin', 'originForm', 'originPath', 'noteZh'];

  function knownLangs() {
    const ids = (VA.langs?.list?.() || []).map((p) => p.id);
    return ids.length ? ids : ['fr', 'en', 'ja', 'ko'];
  }

  function isKnownLang(id) {
    return knownLangs().includes(id);
  }

  function normFor(lang, value) {
    const strategy = VA.langs?.LANGS?.[lang]?.normalize;
    return S().normalizeQuery(value, strategy);
  }

  function blank(value) {
    return value == null || (typeof value === 'string' && !String(value).trim());
  }

  function cloneData(value) {
    if (value == null) return value;
    return JSON.parse(JSON.stringify(value));
  }

  function earlierStamp(a, b) {
    const left = String(a || '').trim();
    const right = String(b || '').trim();
    if (!left) return right;
    if (!right) return left;
    const ta = Date.parse(left);
    const tb = Date.parse(right);
    if (Number.isNaN(ta) || Number.isNaN(tb)) return left;
    return ta <= tb ? left : right;
  }

  function fillStrings(local, incoming, keys) {
    const out = { ...(local || {}) };
    let filled = 0;
    for (const key of keys) {
      if (blank(out[key]) && incoming && !blank(incoming[key])) {
        out[key] = incoming[key];
        filled += 1;
      }
    }
    return { value: out, filled };
  }

  function morphKey(row) {
    const surface = S().bareForm(row?.surface);
    const kind = String(row?.kind || '').trim().toLowerCase();
    if (surface) return `${kind}|${surface}`;
    return String(row?.id || '');
  }

  function pathKey(step) {
    const era = String(step?.era || '').trim();
    const form = S().bareForm(step?.form);
    if (!era && !form) return '';
    return `${era}|${form}`;
  }

  function mergeByKey(localList, incomingList, keyFn, mergeItem) {
    const local = Array.isArray(localList) ? localList.map((item) => ({ ...item })) : [];
    const index = new Map();
    local.forEach((item, i) => {
      const key = keyFn(item);
      if (key && !index.has(key)) index.set(key, i);
    });
    let filled = 0;
    for (const incoming of incomingList || []) {
      if (!incoming || typeof incoming !== 'object') continue;
      const key = keyFn(incoming);
      if (!key) continue;
      if (!index.has(key)) {
        local.push(cloneData(incoming));
        index.set(key, local.length - 1);
        filled += 1;
        continue;
      }
      const at = index.get(key);
      const merged = mergeItem(local[at], incoming);
      local[at] = merged.value;
      filled += merged.filled;
    }
    return { value: local, filled };
  }

  function mergeAttested(local, incoming) {
    const has = (row) => ATTESTED_KEYS.some((key) => !blank(row?.[key]));
    if (!has(local)) {
      return has(incoming) ? { value: cloneData(incoming), filled: 1 } : { value: local || {}, filled: 0 };
    }
    return fillStrings(local, incoming, ATTESTED_KEYS);
  }

  function mergeAnalysis(local, incoming) {
    if (!local || typeof local !== 'object') {
      return incoming && typeof incoming === 'object'
        ? { value: cloneData(incoming), filled: 1 }
        : { value: local || null, filled: 0 };
    }
    if (!incoming || typeof incoming !== 'object') return { value: local, filled: 0 };
    const strings = fillStrings(local, incoming, ANALYSIS_KEYS);
    const attested = mergeAttested(local.firstAttested, incoming.firstAttested);
    const example = fillStrings(local.example || {}, incoming.example || {}, ['fr', 'zh']);
    const morphemes = mergeByKey(local.morphemes, incoming.morphemes, morphKey, (a, b) => fillStrings(a, b, MORPH_KEYS));
    const path = mergeByKey(local.path, incoming.path, pathKey, (a, b) => fillStrings(a, b, PATH_KEYS));
    return {
      value: {
        ...local,
        ...strings.value,
        firstAttested: attested.value,
        example: example.value,
        morphemes: morphemes.value,
        path: path.value,
      },
      filled: strings.filled + attested.filled + example.filled + morphemes.filled + path.filled,
    };
  }

  function mergeHistoryRow(local, incoming) {
    const analysis = mergeAnalysis(local.analysis, incoming.analysis);
    const strings = fillStrings(local, incoming, HISTORY_KEYS);
    let filled = analysis.filled + strings.filled;
    const row = {
      ...local,
      ...strings.value,
      id: local.id || incoming.id || makeId(),
      normalized: local.normalized,
      createdAt: earlierStamp(local.createdAt, incoming.createdAt),
      analysis: analysis.value,
    };
    if (blank(row.glossZh) && !blank(analysis.value?.glossZh)) {
      row.glossZh = analysis.value.glossZh;
      filled += 1;
    }
    if (blank(row.pos) && !blank(analysis.value?.pos)) {
      row.pos = analysis.value.pos;
      filled += 1;
    }
    if (filled) row.updatedAt = new Date().toISOString();
    return { value: row, filled };
  }

  function unionWords(local, incoming) {
    const out = [];
    let filled = 0;
    for (const word of local || []) {
      const text = String(word || '').trim();
      if (text && !out.includes(text)) out.push(text);
    }
    for (const word of incoming || []) {
      const text = String(word || '').trim();
      if (!text || out.includes(text) || out.length >= 12) continue;
      out.push(text);
      filled += 1;
    }
    return { value: out, filled };
  }

  function mergeCabinetRow(local, incoming) {
    const strings = fillStrings(local, incoming, CABINET_KEYS);
    const words = unionWords(local.words, incoming.words);
    const prevCount = Number(local.count) || 0;
    const count = Math.max(prevCount, Number(incoming.count) || 0);
    let filled = strings.filled + words.filled;
    if (count > prevCount) filled += 1;
    const row = {
      ...local,
      ...strings.value,
      id: local.id || incoming.id || makeId(),
      words: words.value,
      count,
      firstSeen: earlierStamp(local.firstSeen, incoming.firstSeen),
    };
    if (filled) row.updatedAt = new Date().toISOString();
    return { value: row, filled };
  }

  function cleanHistoryRow(row, lang) {
    if (!row || typeof row !== 'object') return null;
    const analysis = row.analysis && typeof row.analysis === 'object' ? cloneData(row.analysis) : null;
    const lemma = String(row.lemma || row.query || analysis?.lemma || analysis?.word || '').trim();
    const normalized = normFor(lang, row.normalized || lemma);
    if (!normalized) return null;
    const now = new Date().toISOString();
    return {
      id: String(row.id || '').trim() || makeId(),
      query: String(row.query || lemma),
      normalized,
      lemma: String(row.lemma || analysis?.lemma || lemma),
      glossZh: String(row.glossZh || analysis?.glossZh || ''),
      pos: String(row.pos || analysis?.pos || ''),
      createdAt: String(row.createdAt || '').trim() || now,
      updatedAt: String(row.updatedAt || '').trim() || now,
      analysis: analysis || { word: lemma, lemma, glossZh: String(row.glossZh || ''), morphemes: [], path: [] },
      loans: row.loans && typeof row.loans === 'object' && !Array.isArray(row.loans) ? row.loans : undefined,
    };
  }

  function cleanCabinetRow(row) {
    if (!row || typeof row !== 'object') return null;
    const surface = String(row.surface || '').trim();
    if (!surface) return null;
    const now = new Date().toISOString();
    return {
      id: String(row.id || '').trim() || makeId(),
      surface,
      kind: String(row.kind || ''),
      meaningZh: String(row.meaningZh || ''),
      meaningFr: String(row.meaningFr || ''),
      origin: String(row.origin || ''),
      originForm: String(row.originForm || ''),
      originPath: String(row.originPath || ''),
      noteZh: String(row.noteZh || ''),
      firstSeen: String(row.firstSeen || '').trim() || now,
      updatedAt: String(row.updatedAt || '').trim() || now,
      count: Number(row.count) || 0,
      words: Array.isArray(row.words) ? row.words.map((word) => String(word || '').trim()).filter(Boolean).slice(0, 12) : [],
    };
  }

  function bucketLangs(bucket) {
    if (!bucket || typeof bucket !== 'object' || Array.isArray(bucket)) return [];
    return Object.keys(bucket).filter(isKnownLang);
  }

  function exportBundle() {
    migrateLangBuckets();
    const history = {};
    const cabinet = {};
    for (const id of knownLangs()) {
      history[id] = loadHistory(id);
      cabinet[id] = loadCabinet(id);
    }
    return {
      type: BACKUP_TYPE,
      version: 1,
      exportedAt: new Date().toISOString(),
      history,
      cabinet,
    };
  }

  function parseBackup(text) {
    let data;
    try {
      data = JSON.parse(String(text || ''));
    } catch {
      throw new Error('這個檔案不是 JSON。');
    }
    if (!data || typeof data !== 'object' || Array.isArray(data) || data.type !== BACKUP_TYPE) {
      throw new Error('這個檔案不是詞的煉金爐備份。');
    }
    const history = data.history && typeof data.history === 'object' && !Array.isArray(data.history) ? data.history : {};
    const cabinet = data.cabinet && typeof data.cabinet === 'object' && !Array.isArray(data.cabinet) ? data.cabinet : {};
    return {
      type: BACKUP_TYPE,
      version: Number(data.version) || 1,
      exportedAt: String(data.exportedAt || ''),
      history,
      cabinet,
    };
  }

  function mergeBucket(lang, incoming, load, save, clean, mergeRow, keyOf) {
    const local = load(lang).map((row) => cloneData(row));
    const map = new Map();
    local.forEach((row) => {
      const key = keyOf(row, lang);
      if (key && !map.has(key)) map.set(key, row);
    });
    const addedRows = [];
    const stats = { added: 0, filled: 0, skipped: 0 };
    for (const raw of Array.isArray(incoming) ? incoming : []) {
      const row = clean(raw, lang);
      if (!row) continue;
      const key = keyOf(row, lang);
      if (!key) continue;
      const prev = map.get(key);
      if (!prev) {
        map.set(key, row);
        addedRows.push(row);
        stats.added += 1;
        continue;
      }
      const merged = mergeRow(prev, row);
      const addedAt = addedRows.indexOf(prev);
      if (addedAt >= 0) addedRows[addedAt] = merged.value;
      else local[local.indexOf(prev)] = merged.value;
      map.set(key, merged.value);
      if (addedAt >= 0) continue;
      if (merged.filled) stats.filled += 1;
      else stats.skipped += 1;
    }
    const kept = local.map((row) => map.get(keyOf(row, lang)) || row);
    save([...addedRows, ...kept], lang);
    return stats;
  }

  function replaceBucket(lang, incoming, save, clean) {
    const rows = (Array.isArray(incoming) ? incoming : []).map((row) => clean(row, lang)).filter(Boolean);
    save(rows, lang);
    return rows.length;
  }

  function importBundle(data, mode) {
    const backup = data && data.type === BACKUP_TYPE ? data : parseBackup(JSON.stringify(data || {}));
    const replace = mode === 'replace';
    const history = { added: 0, filled: 0, skipped: 0, replaced: 0 };
    const cabinet = { added: 0, filled: 0, skipped: 0, replaced: 0 };
    if (replace) {
      bucketLangs(backup.history).forEach((lang) => {
        history.replaced += replaceBucket(lang, backup.history[lang], saveHistory, cleanHistoryRow);
      });
      bucketLangs(backup.cabinet).forEach((lang) => {
        cabinet.replaced += replaceBucket(lang, backup.cabinet[lang], saveCabinet, cleanCabinetRow);
      });
      return { mode: 'replace', history, cabinet };
    }
    bucketLangs(backup.history).forEach((lang) => {
      const stats = mergeBucket(
        lang,
        backup.history[lang],
        loadHistory,
        saveHistory,
        cleanHistoryRow,
        mergeHistoryRow,
        (row) => row.normalized
      );
      history.added += stats.added;
      history.filled += stats.filled;
      history.skipped += stats.skipped;
    });
    bucketLangs(backup.cabinet).forEach((lang) => {
      const stats = mergeBucket(
        lang,
        backup.cabinet[lang],
        loadCabinet,
        saveCabinet,
        cleanCabinetRow,
        mergeCabinetRow,
        (row) => morphKey(row)
      );
      cabinet.added += stats.added;
      cabinet.filled += stats.filled;
      cabinet.skipped += stats.skipped;
    });
    return { mode: 'merge', history, cabinet };
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

  // FileSystemHandle 只能放 IndexedDB，不能放 localStorage。
  const CLOUD_IDB_NAME = 'athanor_cloud_v1';
  const CLOUD_IDB_VERSION = 1;
  const CLOUD_STORE = 'kv';
  const CLOUD_HANDLE_KEY = 'dir';
  const CLOUD_META_KEY = 'athanor.cloud.meta';
  const CLOUD_BACKUP_FILE = 'athanor-backup.json';
  const CLOUD_BACKUP_TMP = 'athanor-backup.json.tmp';
  let cloudDbPromise = null;
  /** undefined＝尚未讀過；null＝沒有連結 */
  let cloudHandleCache;

  function cloudFolderSupported() {
    return typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function';
  }

  function openCloudDb() {
    if (typeof indexedDB === 'undefined' || !indexedDB) {
      return Promise.reject(new Error('這個瀏覽器沒有 IndexedDB，不能記住資料夾'));
    }
    if (!cloudDbPromise) {
      cloudDbPromise = new Promise((resolve, reject) => {
        const req = indexedDB.open(CLOUD_IDB_NAME, CLOUD_IDB_VERSION);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(CLOUD_STORE)) db.createObjectStore(CLOUD_STORE);
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => {
          cloudDbPromise = null;
          reject(req.error || new Error('無法記住雲端資料夾'));
        };
      });
    }
    return cloudDbPromise;
  }

  function cloudIdbGet(db, key) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(CLOUD_STORE, 'readonly');
      const req = tx.objectStore(CLOUD_STORE).get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  function cloudIdbPut(db, key, value) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(CLOUD_STORE, 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onabort = () => reject(tx.error || new Error('雲端資料夾寫入中止'));
      tx.onerror = () => reject(tx.error || new Error('雲端資料夾寫入失敗'));
      tx.objectStore(CLOUD_STORE).put(value, key);
    });
  }

  function cloudIdbDelete(db, key) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(CLOUD_STORE, 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onabort = () => reject(tx.error || new Error('雲端資料夾刪除中止'));
      tx.onerror = () => reject(tx.error || new Error('雲端資料夾刪除失敗'));
      tx.objectStore(CLOUD_STORE).delete(key);
    });
  }

  function loadCloudMeta() {
    try {
      const raw = localStorage.getItem(CLOUD_META_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }

  function saveCloudMeta(patch) {
    const next = { ...loadCloudMeta(), ...patch };
    localStorage.setItem(CLOUD_META_KEY, JSON.stringify(next));
    return next;
  }

  function rememberCloudHandle(handle) {
    cloudHandleCache = handle && typeof handle.getFileHandle === 'function' ? handle : null;
    return cloudHandleCache;
  }

  async function loadCloudHandle() {
    if (cloudHandleCache !== undefined) return cloudHandleCache;
    const db = await openCloudDb();
    const handle = await cloudIdbGet(db, CLOUD_HANDLE_KEY);
    return rememberCloudHandle(handle);
  }

  async function ensureCloudPermission(handle, mode) {
    const opts = { mode };
    try {
      if (typeof handle.queryPermission === 'function') {
        if ((await handle.queryPermission(opts)) === 'granted') return true;
      }
      if (typeof handle.requestPermission === 'function') {
        return (await handle.requestPermission(opts)) === 'granted';
      }
    } catch (err) {
      if (err && (err.name === 'NotAllowedError' || err.name === 'SecurityError' || err.name === 'AbortError')) {
        return false;
      }
      throw err;
    }
    return true;
  }

  async function cloudFolderStatus() {
    const meta = loadCloudMeta();
    const supported = cloudFolderSupported();
    let handle = null;
    let permission = 'missing';
    try {
      handle = await loadCloudHandle();
    } catch {
      handle = null;
    }
    if (handle) {
      try {
        if (typeof handle.queryPermission === 'function') {
          permission = await handle.queryPermission({ mode: 'readwrite' });
        } else {
          permission = 'granted';
        }
      } catch {
        permission = 'prompt';
      }
    }
    return {
      supported,
      linked: Boolean(handle),
      name: (handle && handle.name) || meta.name || '',
      permission,
      syncedAt: meta.syncedAt || '',
      loadedAt: meta.loadedAt || '',
      fileName: CLOUD_BACKUP_FILE,
    };
  }

  async function ensureCloudFolderPermission(mode = 'readwrite') {
    const handle = cloudHandleCache !== undefined ? cloudHandleCache : await loadCloudHandle();
    if (!handle) return false;
    return ensureCloudPermission(handle, mode);
  }

  async function pickCloudFolder() {
    if (!cloudFolderSupported()) {
      throw new Error('此瀏覽器不能記住資料夾。請用 Chrome 或 Edge 開本機網址。');
    }
    let handle;
    try {
      try {
        handle = await window.showDirectoryPicker({
          id: 'athanor-cloud-backup',
          mode: 'readwrite',
        });
      } catch (err) {
        if (err && err.name === 'TypeError') {
          handle = await window.showDirectoryPicker({ mode: 'readwrite' });
        } else {
          throw err;
        }
      }
    } catch (err) {
      if (err && err.name === 'AbortError') {
        const cancel = new Error('已取消');
        cancel.name = 'AbortError';
        throw cancel;
      }
      throw err;
    }
    const db = await openCloudDb();
    await cloudIdbPut(db, CLOUD_HANDLE_KEY, handle);
    rememberCloudHandle(handle);
    saveCloudMeta({
      name: handle.name || '',
      linkedAt: new Date().toISOString(),
      syncedAt: '',
      loadedAt: '',
    });
    return { name: handle.name || '' };
  }

  async function unlinkCloudFolder() {
    cloudHandleCache = null;
    try {
      const db = await openCloudDb();
      await cloudIdbDelete(db, CLOUD_HANDLE_KEY);
    } catch {
      /* 權限紀錄清不掉時，仍清本機狀態 */
    }
    try {
      localStorage.removeItem(CLOUD_META_KEY);
    } catch {
      /* ignore */
    }
  }

  async function writeTextToDir(dirHandle, name, text) {
    const fileHandle = await dirHandle.getFileHandle(name, { create: true });
    const writable = await fileHandle.createWritable();
    try {
      await writable.write(text);
      await writable.close();
    } catch (err) {
      try {
        await writable.abort();
      } catch {
        /* ignore */
      }
      throw err;
    }
    return fileHandle;
  }

  function cloudBackupText(json) {
    return typeof json === 'string' ? json : JSON.stringify(json, null, 2);
  }

  async function writeCloudBackup(json) {
    const handle = await loadCloudHandle();
    if (!handle) throw new Error('尚未連結資料夾');
    const ok = await ensureCloudPermission(handle, 'readwrite');
    if (!ok) throw new Error('沒有寫入這個資料夾的權限。請再按一次「連結資料夾」。');
    const text = cloudBackupText(json);
    const tmp = await writeTextToDir(handle, CLOUD_BACKUP_TMP, text);
    if (typeof tmp.move === 'function') {
      try {
        await tmp.move(CLOUD_BACKUP_FILE);
      } catch (err) {
        if (!err || err.name !== 'InvalidModificationError') throw err;
        try {
          await handle.removeEntry(CLOUD_BACKUP_FILE);
        } catch {
          /* 目標檔可能不存在 */
        }
        await tmp.move(CLOUD_BACKUP_FILE);
      }
    } else {
      await writeTextToDir(handle, CLOUD_BACKUP_FILE, text);
      try {
        await handle.removeEntry(CLOUD_BACKUP_TMP);
      } catch {
        /* ignore */
      }
    }
    const syncedAt = new Date().toISOString();
    saveCloudMeta({ name: handle.name || '', syncedAt });
    return { name: handle.name || '', fileName: CLOUD_BACKUP_FILE, syncedAt };
  }

  async function readCloudBackup() {
    const handle = await loadCloudHandle();
    if (!handle) throw new Error('尚未連結資料夾');
    const ok = await ensureCloudPermission(handle, 'read');
    if (!ok) throw new Error('沒有讀取這個資料夾的權限。請再按一次「連結資料夾」。');
    let fileHandle;
    try {
      fileHandle = await handle.getFileHandle(CLOUD_BACKUP_FILE);
    } catch (err) {
      if (err && err.name === 'NotFoundError') {
        throw new Error(
          `「${handle.name || '資料夾'}」裡還沒有 ${CLOUD_BACKUP_FILE}。請先在放著這份煉金爐的電腦按「同步到雲端」。`
        );
      }
      throw err;
    }
    const file = await fileHandle.getFile();
    const text = await file.text();
    const loadedAt = new Date().toISOString();
    saveCloudMeta({ name: handle.name || '', loadedAt });
    return { text, name: handle.name || '', fileName: CLOUD_BACKUP_FILE, loadedAt };
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
    saveLoans,
    getHistoryByNormalized,
    removeHistory,
    clearHistory,
    clearAllHistory,
    historyCount,
    loadCabinet,
    collectMorphemes,
    exportBundle,
    parseBackup,
    importBundle,
    bootstrapConfig,
    CLOUD_BACKUP_FILE,
    cloudFolderSupported,
    cloudFolderStatus,
    ensureCloudFolderPermission,
    pickCloudFolder,
    unlinkCloudFolder,
    writeCloudBackup,
    readCloudBackup,
  };
})(typeof window !== 'undefined' ? window : globalThis);

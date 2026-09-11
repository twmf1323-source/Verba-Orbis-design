/**
 * French etymology / alchemy graph schema.
 * file:// safe — no ES modules
 */
(function (global) {
  const VA = (global.VerbaAthanor = global.VerbaAthanor || {});

  const KINDS = ['pfx', 'root', 'sfx', 'cf', 'infl', 'oth', 'han', 'stem'];
  const OPS = ['distill', 'derive', 'compound'];
  const NODE_TYPES = ['word', 'morph', 'root', 'family'];

  const KIND_META = {
    pfx: { zh: '前綴', fr: 'préfixe', principle: '前綴', principleFr: 'préfixe', alch: '' },
    root: { zh: '詞根', fr: 'racine', principle: '詞根', principleFr: 'racine', alch: '' },
    sfx: { zh: '後綴', fr: 'suffixe', principle: '後綴', principleFr: 'suffixe', alch: '' },
    cf: { zh: '構詞成分', fr: 'confixe', principle: '構詞成分', principleFr: 'confixe', alch: '' },
    infl: { zh: '屈折', fr: 'flexion', principle: '屈折', principleFr: 'flexion', alch: '' },
    oth: { zh: '其他', fr: 'autre', principle: '其他', principleFr: 'autre', alch: '' },
    han: { zh: '漢字', fr: 'kanji', principle: '漢字', principleFr: 'kanji', alch: '' },
    stem: { zh: '語幹', fr: 'radical', principle: '語幹', principleFr: 'radical', alch: '' },
  };

  const ORIGIN_LABELS = {
    pie: '原始印歐語',
    pit: '原始義大利語',
    pgmc: '原始日耳曼語',
    lat: '拉丁語',
    latin: '拉丁語',
    vl: '通俗拉丁語',
    pcmc: '通俗拉丁語',
    gk: '古希臘語',
    gr: '古希臘語',
    greek: '古希臘語',
    of: '古法語',
    ofr: '古法語',
    mf: '中古法語',
    fr: '法語',
    an: '盎格魯－諾曼語',
    oe: '古英語',
    ang: '古英語（盎格魯－撒克遜）',
    me: '中古英語',
    emode: '早期現代英語',
    mode: '現代英語',
    on: '古諾斯語',
    it: '義大利語',
    sp: '西班牙語',
    prov: '普羅旺斯語',
    oc: '奧克語',
    ar: '阿拉伯語',
    gaul: '高盧語',
    ger: '德語',
    du: '荷蘭語',
    eng: '英語',
    en: '英語',
    got: '哥德語',
    he: '希伯來語',
    oj: '上代日本語',
    midj: '中世日本語',
    modj: '現代日本語',
    ch: '漢語／中古漢語',
    och: '上古漢語',
    sino: '漢語',
    native: '和語',
    wago: '和語',
    gairaigo: '外來語',
    ok: '古代韓語',
    sk: '中世韓語',
    mk: '現代韓語',
    hanja: '漢字（韓）',
    onyomi: '音讀',
    kun: '訓讀',
  };

  const ERA_CANON = {
    pie: 'PIE',
    protoindoeuropean: 'PIE',
    pit: 'PIt',
    protoitalic: 'PIt',
    pgmc: 'PGmc',
    protogermanic: 'PGmc',
    germanic: 'PGmc',
    gk: 'Gk',
    gr: 'Gk',
    greek: 'Gk',
    ancientgreek: 'Gk',
    lat: 'Lat',
    latin: 'Lat',
    classicallatin: 'Lat',
    cl: 'Lat',
    vl: 'VL',
    vulgarlatin: 'VL',
    pcmc: 'VL',
    ch: 'Ch',
    mch: 'Ch',
    middlechinese: 'Ch',
    och: 'OCH',
    oldchinese: 'OCH',
    oj: 'OJ',
    oldjapanese: 'OJ',
    oe: 'OE',
    ang: 'OE',
    oldenglish: 'OE',
    anglosaxon: 'OE',
    on: 'ON',
    oldnorse: 'ON',
    norse: 'ON',
    of: 'OF',
    ofr: 'OF',
    oldfrench: 'OF',
    an: 'AN',
    anglonorman: 'AN',
    norman: 'AN',
    midj: 'MidJ',
    middlejapanese: 'MidJ',
    me: 'ME',
    middleenglish: 'ME',
    mf: 'MF',
    middlefrench: 'MF',
    emode: 'EModE',
    earlymodernenglish: 'EModE',
    fr: 'Fr',
    french: 'Fr',
    modfr: 'Fr',
    modernfrench: 'Fr',
    modj: 'ModJ',
    ja: 'ModJ',
    jp: 'ModJ',
    japanese: 'ModJ',
    modernjapanese: 'ModJ',
    mode: 'ModE',
    en: 'ModE',
    eng: 'ModE',
    english: 'ModE',
    modernenglish: 'ModE',
    it: 'It',
    italian: 'It',
    sp: 'Sp',
    es: 'Sp',
    spanish: 'Sp',
    prov: 'Prov',
    oc: 'Oc',
    occitan: 'Oc',
    ar: 'Ar',
    arabic: 'Ar',
    gaul: 'Gaul',
    gaulish: 'Gaul',
    ger: 'Ger',
    de: 'Ger',
    german: 'Ger',
    du: 'Du',
    nl: 'Du',
    dutch: 'Du',
    got: 'Got',
    gothic: 'Got',
    he: 'He',
    hebrew: 'He',
    sino: 'Sino',
    native: 'Native',
    wago: 'Native',
    gairaigo: 'Gairaigo',
    ok: 'OK',
    oldkorean: 'OK',
    sk: 'SK',
    middlekorean: 'SK',
    mk: 'MK',
    korean: 'MK',
    modernkorean: 'MK',
    hanja: 'Hanja',
    onyomi: 'Onyomi',
    kunyomi: 'Kun',
    kun: 'Kun',
  };

  const ERA_ORDER = [
    'PIE',
    'PIt',
    'PGmc',
    'OCH',
    'Gk',
    'Lat',
    'Ch',
    'VL',
    'OJ',
    'OE',
    'ON',
    'Got',
    'Gaul',
    'He',
    'Ar',
    'OF',
    'AN',
    'OK',
    'MidJ',
    'ME',
    'MF',
    'SK',
    'It',
    'Sp',
    'Prov',
    'Oc',
    'EModE',
    'Fr',
    'ModJ',
    'ModE',
    'MK',
    'Ger',
    'Du',
    'Eng',
    'Sino',
    'Native',
    'Hanja',
    'Gairaigo',
  ];

  const VIA_LABELS = {
    inherit: '繼承',
    borrow: '借詞',
    learned: '書面借入',
    popular: '通俗音變',
    calque: '仿譯',
    reconstruct: '構擬',
    compound: '合劑',
  };

  const VIA_CANON = {
    inherit: 'inherit',
    inherited: 'inherit',
    inheritance: 'inherit',
    transmission: 'inherit',
    繼承: 'inherit',
    borrow: 'borrow',
    borrowed: 'borrow',
    loan: 'borrow',
    loanword: 'borrow',
    借詞: 'borrow',
    借入: 'borrow',
    learned: 'learned',
    savant: 'learned',
    literary: 'learned',
    書面: 'learned',
    書面借入: 'learned',
    popular: 'popular',
    vernacular: 'popular',
    通俗: 'popular',
    通俗音變: 'popular',
    calque: 'calque',
    loantranslation: 'calque',
    仿譯: 'calque',
    reconstruct: 'reconstruct',
    reconstructed: 'reconstruct',
    reconstruction: 'reconstruct',
    構擬: 'reconstruct',
    compound: 'compound',
    compounding: 'compound',
    合劑: 'compound',
    複合: 'compound',
  };

  const CERTAINTY_LABELS = {
    certain: '確',
    probable: '較穩',
    reconstructed: '構擬',
  };

  const CERTAINTY_CANON = {
    certain: 'certain',
    sure: 'certain',
    attested: 'certain',
    確: 'certain',
    確定: 'certain',
    probable: 'probable',
    likely: 'probable',
    較穩: 'probable',
    或然: 'probable',
    reconstructed: 'reconstructed',
    reconstruction: 'reconstructed',
    uncertain: 'reconstructed',
    構擬: 'reconstructed',
    存疑: 'reconstructed',
  };

  function fnv1aHex(str) {
    let h = 0x811c9dc5;
    const s = String(str || '');
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return (h >>> 0).toString(16).padStart(8, '0');
  }

  function normalizeQuery(q, strategy) {
    let s = String(q || '').normalize('NFC').trim();
    s = s.replace(/[\u200B-\u200D\uFEFF]/g, '');
    s = s.replace(/[’‘`]/g, "'");
    s = s.replace(/\s+/g, ' ');
    s = s.toLowerCase();
    const st = strategy || VA.langs?.current?.()?.normalize || 'latin-accents';
    if (st === 'latin-basic') {
      return s.replace(/[^a-z'\-\s]/g, '').trim();
    }
    if (st === 'ja') {
      return s.replace(
        /[^\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\u3400-\u4DBFー・\-a-zA-Z'']/g,
        ''
      );
    }
    if (st === 'ko') {
      return s.replace(
        /[^\uAC00-\uD7A3\u1100-\u11FF\u3130-\u318F\u4E00-\u9FFF\-a-zA-Z'']/g,
        ''
      );
    }
    s = s.replace(/[^a-zàâäæçéèêëïîôœùûüÿñ'\-\s]/gi, '');
    return s.trim();
  }

  function bareForm(s) {
    return String(s || '')
      .normalize('NFC')
      .replace(/^\*+/, '')
      .replace(/^-|-$/g, '')
      .toLowerCase()
      .trim();
  }

  function eraKey(code) {
    return String(code || '')
      .normalize('NFKC')
      .toLowerCase()
      .replace(/[^a-z0-9\u3040-\u30ff\u4e00-\u9fff]/g, '');
  }

  function normalizeEra(code) {
    const raw = String(code || '').trim();
    if (!raw || raw === '?') return raw || '?';
    const k = eraKey(raw);
    if (ERA_CANON[k]) return ERA_CANON[k];
    const compact = raw.replace(/\s+/g, '');
    if (ERA_CANON[eraKey(compact)]) return ERA_CANON[eraKey(compact)];
    const known = ERA_ORDER.find((e) => e.toLowerCase() === raw.toLowerCase());
    return known || raw;
  }

  function normalizeOrigin(code) {
    const k = eraKey(code);
    if (k === 'eng' || k === 'en' || k === 'english') return 'Eng';
    const era = normalizeEra(code);
    if (era && era !== '?') return era;
    return String(code || '').trim() || (VA.langs?.current?.()?.eraDefault || 'Fr');
  }

  function normalizeVia(via) {
    const raw = String(via || '').trim();
    if (!raw) return '';
    const k = raw.toLowerCase().replace(/[\s_-]+/g, '');
    if (VIA_CANON[k]) return VIA_CANON[k];
    if (VIA_CANON[raw]) return VIA_CANON[raw];
    return VIA_LABELS[raw] ? raw : '';
  }

  function normalizeCertainty(c, form, glossZh) {
    const raw = String(c || '').trim();
    const k = raw.toLowerCase().replace(/[\s_-]+/g, '');
    if (CERTAINTY_CANON[k]) return CERTAINTY_CANON[k];
    if (CERTAINTY_CANON[raw]) return CERTAINTY_CANON[raw];
    const formS = String(form || '');
    const gloss = String(glossZh || '');
    if (/^\*/.test(formS) || /存疑|構擬/.test(gloss)) return 'reconstructed';
    return raw && CERTAINTY_LABELS[raw] ? raw : 'certain';
  }

  function canonicalizeForm(form, era) {
    let s = String(form || '').normalize('NFC').trim().replace(/\s+/g, ' ');
    if (!s) return '';
    const e = String(era || '').toUpperCase();
    if (e === 'PIE' || /^\*/.test(s)) {
      s = s.replace(/^\*+/, '*');
    }
    return s;
  }

  function viaLabel(via) {
    const v = normalizeVia(via);
    return VIA_LABELS[v] || '';
  }

  function certaintyLabel(c) {
    return CERTAINTY_LABELS[c] || CERTAINTY_LABELS[normalizeCertainty(c)] || '';
  }

  function parseOriginPath(str) {
    const raw = String(str || '').trim();
    if (!raw) return [];
    const parts = raw
      .split(/\s*(?:→|->|＞|➜|⇒)\s*/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length < 2) return [];
    return parts.map((part) => {
      const m = part.match(/^([A-Za-z][A-Za-z0-9]*)\s+(.+)$/);
      if (m) {
        const era = normalizeEra(m[1]);
        const form = canonicalizeForm(m[2], era);
        return {
          era,
          lang: era,
          form,
          glossZh: '',
          via: /^\*/.test(form) ? 'reconstruct' : '',
          noteZh: '',
          certainty: normalizeCertainty('', form, ''),
        };
      }
      return {
        era: '?',
        lang: '?',
        form: canonicalizeForm(part, ''),
        glossZh: '',
        via: '',
        noteZh: '',
        certainty: /^\*/.test(part) ? 'reconstructed' : 'certain',
      };
    });
  }

  function formatOriginPath(steps) {
    return (steps || [])
      .filter((p) => p && p.form && p.form !== '—')
      .map((p) => `${normalizeEra(p.era) || p.era} ${p.form}`.trim())
      .join(' → ');
  }

  function decorateLineage(steps, path) {
    return (steps || []).map((step) => {
      const hit = (path || []).find((p) => bareForm(p.form) === bareForm(step.form));
      if (!hit) return step;
      return {
        ...step,
        glossZh: step.glossZh || hit.glossZh || '',
        noteZh: step.noteZh || hit.noteZh || '',
        via: step.via || hit.via || '',
        certainty: step.certainty || hit.certainty || '',
      };
    });
  }

  function lineageFromMorpheme(m, parentPath) {
    const parsed = parseOriginPath(m?.originPath);
    let steps;
    if (parsed.length) {
      steps = parsed;
    } else {
      const surface = String(m?.surface || m?.form || '').trim();
      const originForm = canonicalizeForm(m?.originForm || '', m?.origin);
      const origin = normalizeOrigin(m?.origin || m?.era);
      const eraNow = VA.langs?.current?.()?.eraDefault || 'Fr';
      steps = [];
      if (originForm && bareForm(originForm) !== bareForm(surface)) {
        steps.push({
          era: origin || '?',
          lang: origin || '?',
          form: originForm,
          glossZh: String(m?.meaningZh || '').trim(),
          via: /^\*/.test(originForm) ? 'reconstruct' : 'inherit',
          noteZh: String(m?.noteZh || '').trim(),
          certainty: normalizeCertainty('', originForm, m?.meaningZh),
        });
      }
      if (surface) {
        steps.push({
          era: eraNow,
          lang: eraNow,
          form: surface,
          glossZh: String(m?.meaningZh || '').trim(),
          via: '',
          noteZh: '',
          certainty: 'certain',
        });
      }
    }
    return decorateLineage(steps, parentPath);
  }

  function dedupePath(path) {
    const out = [];
    for (const step of path || []) {
      const prev = out[out.length - 1];
      if (
        prev &&
        normalizeEra(prev.era) === normalizeEra(step.era) &&
        bareForm(prev.form) === bareForm(step.form)
      ) {
        if ((step.noteZh || '').length > (prev.noteZh || '').length) out[out.length - 1] = step;
        continue;
      }
      out.push(step);
    }
    return out;
  }

  function isAtomicAnalysis(analysis) {
    if (analysis?.atomic) return true;
    const morphs = analysis?.morphemes || [];
    if (!morphs.length) return true;
    if (morphs.length > 1) return false;
    return bareForm(morphs[0].surface) === bareForm(analysis.lemma || analysis.word);
  }

  function analysisFromMorpheme(m, parent) {
    const surface = String(m?.surface || m?.form || '').trim();
    const meaningZh = String(m?.meaningZh || m?.gloss || '').trim();
    const meaningFr = String(m?.meaningFr || '').trim();
    const origin = normalizeOrigin(m?.origin || m?.era);
    const originForm = canonicalizeForm(m?.originForm || '', origin);
    const noteZh = String(m?.noteZh || m?.link || '').trim();
    const eraNow = VA.langs?.current?.()?.eraDefault || 'Fr';
    const parsed = parseOriginPath(m?.originPath);
    const path = parsed.length ? parsed : lineageFromMorpheme({ ...m, surface, origin, originForm, meaningZh, noteZh });
    const originPath = String(m?.originPath || '').trim() || formatOriginPath(path);
    const kind = normalizeKind(m?.kind || 'root');
    return {
      demo: true,
      atomic: true,
      word: surface,
      lemma: surface,
      ipa: '',
      pos: kind,
      gender: '',
      glossZh: meaningZh,
      glossFr: meaningFr,
      alchNoteZh: noteZh || '此為最小語素，不再切割。爐火只煉出它的意思與來源。',
      morphemes: [
        {
          id: m?.id || mintMorphId(surface, kind),
          surface,
          kind,
          meaningZh,
          meaningFr,
          origin: origin || eraNow,
          originForm: originForm || surface,
          originPath,
          noteZh,
        },
      ],
      path,
      firstAttested: emptyAttested(),
      example: { fr: '', zh: '' },
    };
  }

  function atomicMorphemeFromAnalysis(a) {
    const lemma = String(a?.lemma || a?.word || '').trim();
    return {
      id: mintMorphId(lemma, 'root'),
      surface: lemma,
      kind: 'root',
      meaningZh: a?.glossZh || '',
      meaningFr: a?.glossFr || '',
      origin: VA.langs?.current?.()?.eraDefault || 'Fr',
      originForm: lemma,
      originPath: formatOriginPath(a?.path) || '',
      noteZh: a?.alchNoteZh || '此形已是最小單位，不再切割。',
    };
  }

  function queryTooLong(normalized) {
    if (!normalized) return { ok: false, reason: 'empty' };
    if (normalized.length > 48) return { ok: false, reason: 'chars' };
    const tokens = normalized.split(/\s+/).filter(Boolean);
    if (tokens.length > 4) return { ok: false, reason: 'tokens' };
    return { ok: true, long: normalized.length > 24 };
  }

  function normalizePos(pos) {
    const p = String(pos || '').toLowerCase().trim();
    const map = {
      noun: 'n',
      n: 'n',
      nom: 'n',
      verb: 'v',
      v: 'v',
      verbe: 'v',
      adj: 'adj',
      adjective: 'adj',
      adv: 'adv',
      adverb: 'adv',
      prep: 'prep',
      prép: 'prep',
      conj: 'conj',
      pron: 'pron',
      phr: 'phr',
      idiom: 'idiom',
      pref: 'pfx',
      prefix: 'pfx',
    };
    if (map[p]) return map[p];
    if (p.includes('/')) {
      return p
        .split('/')
        .map((x) => map[x.trim()] || x.trim())
        .filter(Boolean)
        .join('/');
    }
    return p || 'n';
  }

  function normalizeKind(k) {
    const x = String(k || '').toLowerCase().trim();
    if (x === 'prefix' || x === 'préfixe' || x === 'pref') return 'pfx';
    if (x === 'suffix' || x === 'suffixe' || x === 'suf') return 'sfx';
    if (x === 'r' || x === 'racine' || x === 'stem' || x === 'base') return 'root';
    if (x === 'combining' || x === 'confixe' || x === 'element') return 'cf';
    if (x === 'inflection' || x === 'flexion' || x === 'ending') return 'infl';
    if (x === 'han' || x === 'kanji' || x === '漢字') return 'han';
    if (x === 'stem' || x === '語幹') return 'stem';
    if (KINDS.includes(x)) return x;
    return 'oth';
  }

  function normalizeGender(g) {
    const x = String(g || '').toLowerCase().trim();
    if (x === 'm' || x === 'masc' || x === 'masculin') return 'm';
    if (x === 'f' || x === 'fem' || x === 'féminin' || x === 'feminin') return 'f';
    if (x === 'mf' || x === 'epicene' || x === 'épicène' || x === 'both') return 'mf';
    if (x === 'n' || x === 'neutre') return 'n';
    return '';
  }

  function mintMorphId(surface, kind) {
    const raw = `${normalizeKind(kind)}|${normalizeQuery(surface)}`;
    return 'm_' + fnv1aHex(raw);
  }

  function mintNodeId(type, key) {
    return `${type}:${fnv1aHex(String(key || ''))}`;
  }

  function originLabel(code) {
    const canon = normalizeOrigin(code);
    const k = String(canon || code || '')
      .toLowerCase()
      .replace(/[^a-z]/g, '');
    return ORIGIN_LABELS[k] || canon || code || '來源未明';
  }

  function kindMeta(kind) {
    return KIND_META[normalizeKind(kind)] || KIND_META.oth;
  }

  function clampStr(v, n) {
    const s = String(v || '').trim();
    if (s.length <= n) return s;
    return s.slice(0, n - 1) + '…';
  }

  function asArray(v) {
    return Array.isArray(v) ? v : v == null ? [] : [v];
  }

  function hasZh(s) {
    return /[\u4e00-\u9fff]/.test(String(s || ''));
  }

  function pickGloss(raw, keys, n) {
    if (!raw || typeof raw !== 'object') return clampStr(raw, n);
    for (const k of keys) {
      const v = k.includes('.') ? k.split('.').reduce((o, p) => (o == null ? o : o[p]), raw) : raw[k];
      if (v && typeof v === 'object') {
        const nested = v.zh || v.fr || v.zhTW || '';
        if (nested) return clampStr(nested, n);
      } else if (String(v || '').trim()) {
        return clampStr(v, n);
      }
    }
    return '';
  }

  function pickZh(raw, keys, n) {
    if (!raw || typeof raw !== 'object') {
      const s = clampStr(raw, n);
      return hasZh(s) ? s : '';
    }
    for (const k of keys) {
      const v = k.includes('.') ? k.split('.').reduce((o, p) => (o == null ? o : o[p]), raw) : raw[k];
      let s = '';
      if (v && typeof v === 'object') {
        s = String(v.zh || v.zhTW || v.zhCN || '').trim();
      } else {
        s = String(v || '').trim();
      }
      if (hasZh(s)) return clampStr(s, n);
    }
    return '';
  }

  function normalizeMorpheme(raw, index) {
    const surface = String(raw?.surface || raw?.form || raw?.S || '').trim();
    const kind = normalizeKind(raw?.kind || raw?.K);
    const id = String(raw?.id || '').trim() || mintMorphId(surface || String(index), kind);
    const meaningZh = pickZh(raw, ['meaningZh', 'zh', 'glossZh', 'M.zh', 'meaning', 'def', 'definition'], 40);
    const meaningFr = pickGloss(raw, ['meaningFr', 'meaningNative', 'meaningEn', 'fr', 'en', 'glossFr', 'M.fr', 'M.en'], 48);
    const noteZh = pickZh(raw, ['noteZh', 'note', 'N.zh', 'comment'], 200) || pickGloss(raw, ['noteZh', 'note', 'N.zh', 'comment'], 200);
    const origin = normalizeOrigin(raw?.origin || raw?.O || '') || (VA.langs?.current?.()?.eraDefault || 'Fr');
    const originForm = canonicalizeForm(raw?.originForm || raw?.F || '', origin);
    const originPath = Array.isArray(raw?.lineage)
      ? formatOriginPath(raw.lineage)
      : String(raw?.originPath || '').trim();
    return {
      id,
      surface: surface || '—',
      kind,
      meaningZh,
      meaningFr,
      origin,
      originForm,
      originPath,
      noteZh,
    };
  }

  function normalizeIpa(raw) {
    const s = String(raw || '').trim();
    if (!s) return '';
    const all = s.match(/\/[^/]+\/|\[[^\]]+\]/g);
    if (all && all.length) return clampStr(all[0], 48);
    if (s.length > 48 && /[\u02C8\u02CCːˌ]/.test(s)) return clampStr(s.split(/[;|→>]/)[0], 48);
    return clampStr(s, 48);
  }

  function isIpaForm(s) {
    const t = String(s || '').trim();
    return /^[/[].*[/]]$/.test(t) || /^\/[^/]+\/$/.test(t);
  }

  function normalizePathStep(raw) {
    const era = normalizeEra(raw?.era || raw?.E || raw?.lang || '') || '?';
    let form = canonicalizeForm(raw?.form || raw?.F || '', era) || '—';
    const glossZh = pickZh(raw, ['glossZh', 'zh', 'M.zh', 'meaning', 'meaningZh'], 80);
    if (isIpaForm(form)) {
      form = canonicalizeForm(raw?.spelling || raw?.orth || raw?.word || '', era) || form.replace(/^[/[]|[/\]]$/g, '');
    }
    const noteZh = pickZh(raw, ['noteZh', 'note', 'N.zh', 'comment', 'shiftZh'], 160) || pickGloss(raw, ['noteZh', 'note', 'N.zh', 'comment', 'shiftZh'], 160);
    return {
      era,
      lang: normalizeEra(raw?.lang || raw?.L || era) || era,
      form: form || '—',
      glossZh,
      via: normalizeVia(raw?.via || raw?.route || raw?.how) || (era === 'PIE' || /^\*/.test(form) ? 'reconstruct' : ''),
      noteZh,
      certainty: normalizeCertainty(raw?.certainty || raw?.conf, form, glossZh),
    };
  }

  function normalizeYear(raw) {
    const s = String(raw || '').trim();
    if (!s) return '';
    const year4 = s.match(/\b((?:1[0-9]|20)\d{2})\b/);
    if (year4) return year4[1];
    const cent = s.match(/\b([1-9]|1[0-9]|20)\s*(?:c\.?|th|st|nd|rd|e|ème|世紀|cent(?:ury)?|s\.?)\b/i);
    if (cent) return `${cent[1]}c`;
    const named = s.match(/上代|中世|近世|近代|現代|奈良|平安|鎌倉|室町|江戶|江戸|明治|大正|昭和|開化|朝鮮|高麗|古代/);
    if (named) return named[0];
    return clampStr(s.replace(/\s+/g, ' '), 24);
  }

  function yearLabel(year) {
    const y = String(year || '').trim();
    if (!y) return '';
    if (/^\d{3,4}$/.test(y)) return `${y} 年`;
    const m = y.match(/^(\d{1,2})c$/i);
    if (m) return `${m[1]} 世紀`;
    return y;
  }

  function emptyAttested() {
    return { year: '', era: '', form: '', whereZh: '', sourceZh: '', author: '', work: '', certainty: '' };
  }

  function formatWorkCite(author, work) {
    const a = String(author || '').trim();
    const w = String(work || '').trim();
    if (!a && !w) return '';
    if (!w) return a;
    const titled = /[《「『]/.test(w) ? w : `《${w}》`;
    return a ? `${a} ${titled}` : titled;
  }

  function normalizeFirstAttested(raw) {
    if (!raw || typeof raw !== 'object') {
      const text = String(raw || '').trim();
      if (!text) return emptyAttested();
      return {
        year: normalizeYear(text),
        era: '',
        form: '',
        whereZh: clampStr(text, 80),
        sourceZh: '',
        author: '',
        work: '',
        certainty: 'probable',
      };
    }
    const form = canonicalizeForm(raw.form || raw.F || '', raw.era);
    const whereZh = pickGloss(raw, ['whereZh', 'placeZh', 'attestedZh', 'zh', 'where'], 80);
    const year = normalizeYear(raw.year || raw.date || raw.when || raw.century || '');
    const author = clampStr(raw.author || raw.authorZh || raw.writer || '', 48);
    const work = clampStr(raw.work || raw.workZh || raw.title || raw.book || '', 80);
    const has = Boolean(year || whereZh || form || author || work);
    return {
      year,
      era: has ? normalizeEra(raw.era || raw.lang || '') || '' : '',
      form,
      whereZh,
      sourceZh: clampStr(raw.sourceZh || raw.source || raw.ref || '', 48),
      author,
      work,
      certainty: has ? normalizeCertainty(raw.certainty || 'probable', form, whereZh) : '',
    };
  }

  function isWeakAttested(a) {
    return isWeakNote(a?.whereZh) && isWeakNote(a?.year);
  }

  function formatFirstAttested(a) {
    const att = a && typeof a === 'object' ? a : emptyAttested();
    if (isWeakAttested(att)) return null;
    const when = yearLabel(att.year);
    const era = att.era ? originLabel(att.era) : '';
    const head = [when, era].filter(Boolean).join(' · ');
    return {
      head,
      whereZh: att.whereZh || '',
      form: att.form || '',
      cite: formatWorkCite(att.author, att.work),
      author: att.author || '',
      work: att.work || '',
      sourceZh: att.sourceZh || '',
      certainty: att.certainty || '',
      certLabel: certaintyLabel(att.certainty),
    };
  }

  function isWeakGloss(s) {
    const t = String(s || '').trim();
    if (!t) return true;
    if (/^(前綴|後綴|詞根|語素|構詞成分|屈折|prefixe?|suffixe?|racine|root|affix|stem)$/i.test(t)) return true;
    return !hasZh(t);
  }

  function isWeakNote(s) {
    return !String(s || '').trim();
  }

  function missingGlosses(analysis) {
    const morphs = (analysis?.morphemes || []).filter((m) => isWeakGloss(m.meaningZh));
    const path = (analysis?.path || []).filter((p) => isWeakGloss(p.glossZh));
    const word = isWeakGloss(analysis?.glossZh);
    const attested = isWeakAttested(analysis?.firstAttested);
    return { morphs, path, word, attested, any: morphs.length + path.length > 0 || word || attested };
  }

  function mergeGlosses(analysis, fill) {
    const extras = asArray(fill?.morphemes);
    const pathFill = asArray(fill?.path);
    const next = {
      ...analysis,
      glossZh: isWeakGloss(analysis.glossZh)
        ? clampStr(fill?.glossZh || fill?.zh || analysis.glossZh, 48)
        : analysis.glossZh,
      glossFr: analysis.glossFr || clampStr(fill?.glossFr || fill?.fr || '', 80),
      morphemes: (analysis.morphemes || []).map((m) => {
        const extra =
          extras.find((x) => x.id && x.id === m.id) ||
          extras.find((x) => x.surface && x.surface === m.surface);
        if (!extra) return m;
        return {
          ...m,
          meaningZh: isWeakGloss(m.meaningZh)
            ? clampStr(extra.meaningZh || extra.zh || m.meaningZh, 40)
            : m.meaningZh,
          meaningFr: m.meaningFr || clampStr(extra.meaningFr || extra.fr || '', 48),
          noteZh: m.noteZh || clampStr(extra.noteZh || extra.note || '', 200),
          originPath: m.originPath || String(extra.originPath || '').trim(),
        };
      }),
      path: (analysis.path || []).map((p) => {
        const extra =
          pathFill.find((x) => x.form === p.form && (!x.era || x.era === p.era)) ||
          pathFill.find((x) => x.form === p.form);
        if (!extra) return p;
        return {
          ...p,
          glossZh: isWeakGloss(p.glossZh)
            ? clampStr(extra.glossZh || extra.zh || p.glossZh, 80)
            : p.glossZh,
          noteZh: isWeakNote(p.noteZh) ? clampStr(extra.noteZh || extra.note || '', 160) : p.noteZh,
          via: p.via || normalizeVia(extra.via),
          certainty: p.certainty || normalizeCertainty(extra.certainty, p.form, p.glossZh),
        };
      }),
      firstAttested: (() => {
        const cur = analysis.firstAttested || emptyAttested();
        const extra = normalizeFirstAttested(fill?.firstAttested || fill?.attested);
        if (isWeakAttested(cur)) return extra;
        return {
          ...cur,
          author: cur.author || extra.author,
          work: cur.work || extra.work,
          sourceZh: cur.sourceZh || extra.sourceZh,
        };
      })(),
      _glossFilled: true,
    };
    return backfillZh(next);
  }

  function normalizeAnalysis(raw, query) {
    const word = String(raw?.word || raw?.W || query || '').trim();
    const lemma = String(raw?.lemma || raw?.U || word).trim() || word;
    const morphs = asArray(raw?.morphemes || raw?.m)
      .map((item, i) => normalizeMorpheme(item, i))
      .filter((m) => m.surface && m.surface !== '—');
    const path = dedupePath(asArray(raw?.path || raw?.B?.p).map(normalizePathStep));
    const morphsFilled = morphs.map((m) => {
      if (m.originPath) return m;
      return { ...m, originPath: formatOriginPath(lineageFromMorpheme(m)) };
    });
    const ex = raw?.example || {};
    const out = {
      schemaVersion: 2,
      query: query || word,
      word,
      lemma,
      ipa: normalizeIpa(raw?.ipa || raw?.H || ''),
      pos: normalizePos(raw?.pos || raw?.P),
      gender: normalizeGender(raw?.gender || raw?.A?.g),
      glossZh: pickZh(raw, ['glossZh', 'D.zh', 'zh', 'meaningZh'], 48) || (hasZh(raw?.glossZh) ? clampStr(raw.glossZh, 48) : ''),
      glossFr: clampStr(raw?.glossFr || raw?.glossNative || raw?.glossEn || raw?.D?.fr || raw?.D?.en || '', 80),
      alchNoteZh: pickZh(raw, ['alchNoteZh', 'Y.zh'], 180) || clampStr(raw?.alchNoteZh || raw?.Y?.zh || '', 180),
      firstAttested: normalizeFirstAttested(raw?.firstAttested || raw?.attested || raw?.B?.a),
      morphemes: morphsFilled,
      path,
      example: {
        fr: String(ex.fr || ex.text || ex.en || raw?.X?.[0] || '').trim(),
        zh: String(ex.zh || '').trim(),
      },
      demo: Boolean(raw?.demo),
      atomic: Boolean(raw?.atomic),
    };
    if (!out.atomic && isAtomicAnalysis(out)) out.atomic = true;
    return backfillZh(out);
  }

  function backfillZh(analysis) {
    const a = analysis || {};
    const morphs = a.morphemes || [];
    let glossZh = a.glossZh;
    if (isWeakGloss(glossZh)) {
      const hit = morphs.find((m) => !isWeakGloss(m.meaningZh));
      if (hit) glossZh = hit.meaningZh;
    }
    const morphemes = morphs.map((m) => {
      if (!isWeakGloss(m.meaningZh)) return m;
      if (!isWeakGloss(glossZh) && bareForm(m.surface) === bareForm(a.lemma || a.word)) {
        return { ...m, meaningZh: glossZh };
      }
      return m;
    });
    const path = (a.path || []).map((p) => {
      if (!isWeakGloss(p.glossZh)) return p;
      const morphHit = morphemes.find((m) => bareForm(m.surface) === bareForm(p.form) && !isWeakGloss(m.meaningZh));
      if (morphHit) return { ...p, glossZh: morphHit.meaningZh };
      if (!isWeakGloss(glossZh) && bareForm(p.form) === bareForm(a.lemma || a.word)) {
        return { ...p, glossZh };
      }
      return p;
    });
    return { ...a, glossZh, morphemes, path };
  }

  function normalizeOp(op) {
    const x = String(op || '').toLowerCase().trim();
    if (x === 'solve' || x === 'root' || x === 'back' || x === '蒸餾') return 'distill';
    if (x === 'coagula' || x === 'der' || x === '派生') return 'derive';
    if (x === 'coniunctio' || x === 'cmp' || x === '複合') return 'compound';
    if (OPS.includes(x)) return x;
    return 'derive';
  }

  function normalizeExpandItem(raw, op) {
    const word = String(raw?.word || raw?.form || raw?.F || '').trim();
    if (!word) return null;
    const kind = String(raw?.kind || '').trim() || (op === 'distill' ? 'root' : 'derived');
    return {
      word,
      kind,
      pos: normalizePos(raw?.pos),
      glossZh: pickZh(raw, ['glossZh', 'zh', 'meaningZh', 'M.zh', 'meaning'], 40),
      linkZh: clampStr(raw?.linkZh || '', 80),
      era: normalizeEra(raw?.era || raw?.lang || ''),
    };
  }

  function normalizeExpand(raw, op, seed) {
    const resolvedOp = normalizeOp(raw?.op || op);
    const items = asArray(raw?.items)
      .map((it) => normalizeExpandItem(it, resolvedOp))
      .filter(Boolean)
      .slice(0, 12);
    return {
      op: resolvedOp,
      seed: String(raw?.seed || seed || '').trim(),
      items,
    };
  }

  function repairJson(text) {
    if (!text) throw new Error('Empty AI response');
    let s = String(text).trim();
    const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fence) s = fence[1].trim();
    const start = s.indexOf('{');
    const end = s.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) {
      throw new Error('No JSON object in response');
    }
    s = s.slice(start, end + 1);
    try {
      return JSON.parse(s);
    } catch {
      const repaired = s
        .replace(/,\s*([}\]])/g, '$1')
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
      return JSON.parse(repaired);
    }
  }

  VA.schema = {
    KINDS,
    OPS,
    NODE_TYPES,
    KIND_META,
    ERA_ORDER,
    VIA_LABELS,
    CERTAINTY_LABELS,
    fnv1aHex,
    normalizeQuery,
    bareForm,
    normalizeEra,
    normalizeOrigin,
    normalizeVia,
    normalizeCertainty,
    canonicalizeForm,
    viaLabel,
    certaintyLabel,
    parseOriginPath,
    formatOriginPath,
    lineageFromMorpheme,
    isAtomicAnalysis,
    analysisFromMorpheme,
    atomicMorphemeFromAnalysis,
    queryTooLong,
    normalizePos,
    normalizeKind,
    normalizeGender,
    mintMorphId,
    mintNodeId,
    hasZh,
    originLabel,
    kindMeta,
    normalizeMorpheme,
    missingGlosses,
    mergeGlosses,
    normalizeYear,
    yearLabel,
    normalizeFirstAttested,
    formatFirstAttested,
    formatWorkCite,
    isWeakAttested,
    normalizeAnalysis,
    normalizeOp,
    normalizeExpand,
    repairJson,
  };
})(typeof window !== 'undefined' ? window : globalThis);

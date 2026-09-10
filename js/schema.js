/**
 * Verba Orbis schema — normalize / detect / sense keys (file:// safe)
 */
(function (global) {
  const VO = (global.VerbaOrbis = global.VerbaOrbis || {});

  const LANG_ORDER = ['zh', 'ko', 'ja', 'en', 'de', 'es', 'fr', 'it', 'la'];
  const ZONE_A = ['zh', 'ko', 'ja'];
  const ZONE_B = ['en', 'de', 'es', 'fr', 'it', 'la'];
  /** On-screen board (not generation order): 韓中日 / 西拉丁德 / 義法英 */
  const BOARD_CJK = ['ko', 'zh', 'ja'];
  const BOARD_EU = ['es', 'la', 'de', 'it', 'fr', 'en'];
  const EQUIV = ['exact', 'narrower', 'wider', 'split', 'approx', 'gap'];
  const DOMAINS = ['日常', '文學', '書面', '宗教', '哲學', '口語', '術語', '古語'];
  const REGISTERS = ['中性', '口語', '書面', '文學', '古語', '俚俗', '敬體'];
  const GENDERS = ['m', 'f', 'n', 'mf', 'inv', ''];

  const POS_MAP = {
    verb: 'v', v: 'v', vb: 'v', 'v.': 'v', vi: 'v', vt: 'v',
    noun: 'n', n: 'n', 'n.': 'n', subst: 'n',
    adjective: 'adj', adj: 'adj', a: 'adj', 'a.': 'adj',
    adverb: 'adv', adv: 'adv',
    preposition: 'prep', prep: 'prep',
    conjunction: 'conj', conj: 'conj',
    pronoun: 'pron', pron: 'pron',
    interjection: 'intj', intj: 'intj',
    particle: 'prt', prt: 'prt',
    num: 'num', number: 'num',
    det: 'det', determiner: 'det',
    aux: 'aux', modal: 'modal',
    phrase: 'phr', idiom: 'idiom',
    動詞: 'v', 名詞: 'n', 形容詞: 'adj', 副詞: 'adv', 助詞: 'prt',
  };

  const DE_CLOSED = [
    'liebe', 'heimweh', 'sehnsucht', 'freundschaft', 'sprache', 'zeit', 'jahr', 'welt',
  ];
  const FR_CLOSED = [
    'aimer', 'être', 'avoir', 'faire', 'dire', 'aller', 'voir', 'savoir',
    'pouvoir', 'vouloir', 'venir', 'parler', 'manger', 'trouver', 'donner', 'passer',
  ];

  function normalizePos(raw) {
    if (raw == null || raw === '') return '';
    let s = Array.isArray(raw) ? raw.join(',') : String(raw);
    s = s.trim();
    if (!s) return '';
    const parts = s
      .split(/[/|,;·•\s]+/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => {
        const key = p.toLowerCase().replace(/\s+/g, '');
        if (POS_MAP[key]) return POS_MAP[key];
        if (POS_MAP[p]) return POS_MAP[p];
        if (/^[a-z]{1,6}$/i.test(p)) return p.toLowerCase();
        return p;
      });
    const seen = new Set();
    const out = [];
    for (const p of parts) {
      if (!seen.has(p)) {
        seen.add(p);
        out.push(p);
      }
    }
    return out.join('/');
  }

  function normalizeQuery(q) {
    let s = String(q || '').normalize('NFC').trim();
    s = s.replace(/[\u200B-\u200D\uFEFF]/g, '');
    s = s.replace(/\s+/g, ' ');
    return s.toLowerCase();
  }

  function fnv1aHex(str) {
    let h = 0x811c9dc5;
    const s = String(str || '');
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return (h >>> 0).toString(16).padStart(8, '0');
  }

  function mintSenseKey(pos, glossZh) {
    const raw = `${normalizePos(pos)}|${normalizeQuery(glossZh)}`;
    return 's_' + fnv1aHex(raw);
  }

  function detectSourceLang(query) {
    const raw = String(query || '');
    const q = normalizeQuery(raw);
    if (/[\uAC00-\uD7A3\u1100-\u11FF\u3130-\u318F]/.test(raw)) return 'ko';
    if (/[\u3040-\u309F\u30A0-\u30FF]/.test(raw)) return 'ja';
    if (/[\u4E00-\u9FFF]/.test(raw)) return 'zh';

    const tokens = q.split(' ').filter(Boolean);
    if (DE_CLOSED.includes(q) || tokens.some((t) => DE_CLOSED.includes(t))) return 'de';
    if (FR_CLOSED.includes(q) || tokens.some((t) => FR_CLOSED.includes(t))) return 'fr';
    if (/^mal du\b/.test(q) || /^coup de\b/.test(q)) return 'fr';

    if (/[ßäöüÄÖÜ]/.test(raw) || /(?:heit|keit|ung|schaft|chen|lein)$/i.test(q) || /[a-z]sch/.test(q)) {
      return 'de';
    }
    if (/(?:are|ire|ere)$/i.test(q) && !FR_CLOSED.includes(q)) return 'it';
    if (/[ñ¿¡]/.test(raw) || (/(?:ar|ir)$/i.test(q) && /ll|ñ|ía/.test(q))) return 'es';
    if (/er$/i.test(q) && /ai|ei|eu|ou|oi|ç|eau|oin|ain|ien/.test(q)) return 'fr';
    return 'en';
  }

  function needsSourceHint(query, detected) {
    const raw = String(query || '');
    if (detected !== 'en') return false;
    if (/[^\u0000-\u007F]/.test(raw)) return false;
    if (/[àáâãäåæçèéêëìíîïñòóôõöùúûüýÿß]/i.test(raw)) return false;
    const q = normalizeQuery(raw);
    if (DE_CLOSED.includes(q) || FR_CLOSED.includes(q)) return false;
    if (/(?:heit|keit|ung|schaft|are|ire|ere|heit)$/i.test(q)) return false;
    return /^[a-zA-Z'’\-\s]+$/.test(raw);
  }

  function effectiveSourceLang(sourceLang, detected) {
    if (sourceLang && sourceLang !== 'auto') return sourceLang;
    return detected || 'zh';
  }

  function normalizeSenseList(raw, query) {
    const empty = { query: query || '', detectedSourceLang: 'zh', candidates: [], error: 'empty' };
    if (!raw || typeof raw !== 'object') return empty;
    const list = Array.isArray(raw.candidates) ? raw.candidates : [];
    const seen = new Set();
    const candidates = [];
    for (const item of list) {
      if (!item || typeof item !== 'object') continue;
      const glossZh = String(item.glossZh || item.gloss || '').trim();
      if (!glossZh) continue;
      const pos = normalizePos(item.pos || 'n') || 'n';
      const senseKey = mintSenseKey(pos, glossZh);
      if (seen.has(senseKey)) continue;
      seen.add(senseKey);
      let domain = String(item.domain || '日常').trim();
      if (!DOMAINS.includes(domain)) domain = '日常';
      candidates.push({
        id: 's' + (candidates.length + 1),
        senseKey,
        pos,
        glossZh: glossZh.slice(0, 80),
        domain,
        headwordHint: String(item.headwordHint || query || '').trim(),
        note: String(item.note || '').trim(),
      });
      if (candidates.length >= 6) break;
    }
    if (!candidates.length) return empty;
    return {
      query: String(raw.query || query || ''),
      detectedSourceLang: LANG_ORDER.includes(raw.detectedSourceLang)
        ? raw.detectedSourceLang
        : detectSourceLang(query),
      candidates,
    };
  }

  function contentWords(s) {
    return String(s || '')
      .replace(/[的了與和及或是在於對把被所之]/g, ' ')
      .split(/[\s,，。；;、／/·•]+/)
      .map((w) => w.trim())
      .filter((w) => w.length >= 2);
  }

  function checkDrift(glossZh, lockGloss) {
    const a = contentWords(glossZh);
    const b = contentWords(lockGloss);
    if (!a.length || !b.length) return false;
    return !a.some((w) => b.some((x) => w.includes(x) || x.includes(w)));
  }

  function stubCard(lang, lockedSense) {
    return {
      lang,
      equiv: 'gap',
      primary: {
        headword: '—',
        reading: '',
        hanja: '',
        glossZh: (lockedSense && lockedSense.glossZh) || '',
        pos: (lockedSense && lockedSense.pos) || 'n',
        register: '中性',
        gender: '',
        plural: '',
        ipa: '',
        isPhrase: true,
      },
      alternatives: [],
      etymologyZh: '',
      cognates: '',
      hanziRelationZh: '',
      semanticRangeZh: '',
      caveatsZh: '模型未回傳此語，請重新比較。',
      example: { text: '', zh: '' },
      _driftWarning: false,
      _stub: true,
    };
  }

  function normalizeLanguageCard(raw, lang, lockedSense) {
    const card = raw && typeof raw === 'object' ? raw : {};
    const primaryIn = card.primary && typeof card.primary === 'object' ? card.primary : {};
    let glossZh = String(primaryIn.glossZh || '').trim();
    let drift = false;
    if (!glossZh) {
      glossZh = (lockedSense && lockedSense.glossZh) || '';
      drift = true;
    } else if (lockedSense && lockedSense.glossZh && checkDrift(glossZh, lockedSense.glossZh)) {
      drift = true;
    }

    let equiv = String(card.equiv || 'approx').toLowerCase();
    if (!EQUIV.includes(equiv)) equiv = 'approx';

    let register = String(primaryIn.register || '中性').trim();
    if (!REGISTERS.includes(register)) register = '中性';

    let gender = String(primaryIn.gender || '').toLowerCase();
    if (!GENDERS.includes(gender)) gender = '';
    if (['zh', 'ko', 'ja', 'en'].includes(lang)) gender = gender || '';

    const alts = Array.isArray(card.alternatives) ? card.alternatives : [];
    const alternatives = alts.slice(0, 6).map((a) => {
      if (!a || typeof a !== 'object') return null;
      const hw = String(a.headword || '').trim();
      if (!hw) return null;
      return {
        headword: hw,
        reading: String(a.reading || '').trim(),
        hanja: String(a.hanja || '').trim(),
        pos: normalizePos(a.pos || '') || '',
        whenToUseZh: String(a.whenToUseZh || '').trim(),
      };
    }).filter(Boolean);

    let headword = String(primaryIn.headword || '').trim();
    if (!headword || /^[—–−\-]+$/.test(headword)) {
      const altHw = alternatives.find((a) => a.headword && !/^[—–−\-]+$/.test(a.headword));
      const pluralHw = String(primaryIn.plural || '').trim();
      headword = (altHw && altHw.headword) || pluralHw || '';
    }

    const out = {
      lang,
      equiv,
      primary: {
        headword,
        reading: String(primaryIn.reading || '').trim(),
        ipa: String(primaryIn.ipa || card.ipa || '').trim().replace(/^\/+|\/+$/g, ''),
        hanja: lang === 'ko' ? String(primaryIn.hanja || '').trim() : '',
        glossZh,
        pos: normalizePos(primaryIn.pos || (lockedSense && lockedSense.pos) || '') || 'n',
        register,
        gender,
        plural: String(primaryIn.plural || '').trim(),
        isPhrase: Boolean(primaryIn.isPhrase) || equiv === 'gap',
      },
      alternatives,
      etymologyZh: String(card.etymologyZh || '').trim(),
      cognates: String(card.cognates || '').trim(),
      hanziRelationZh: String(card.hanziRelationZh || '').trim(),
      semanticRangeZh: String(card.semanticRangeZh || '').trim(),
      caveatsZh: String(card.caveatsZh || '').trim(),
      example: {
        text: String((card.example && card.example.text) || '').trim(),
        zh: String((card.example && card.example.zh) || '').trim(),
      },
      _driftWarning: drift || Boolean(card._driftWarning),
    };

    if (lang === 'ko') {
      const sc = String(card.sinoClass || '').toLowerCase();
      out.sinoClass = ['hanja', 'native', 'loan', 'mixed'].includes(sc) ? sc : 'mixed';
    }
    if (lang === 'ja') {
      const jc = String(card.jpClass || '').toLowerCase();
      out.jpClass = ['kango', 'wago', 'gairaigo', 'mixed'].includes(jc) ? jc : 'mixed';
      const jr = String(card.jpReadingType || '').toLowerCase();
      out.jpReadingType = ['on', 'kun', 'mixed', 'na'].includes(jr) ? jr : 'na';
    }
    return out;
  }

  function pickCard(cards, lang) {
    if (!Array.isArray(cards)) return null;
    return cards.find((c) => c && c.lang === lang) || null;
  }

  function normalizeZoneA(raw, lockedSense) {
    const src = raw && typeof raw === 'object' ? raw : {};
    const cardsIn = Array.isArray(src.cards) ? src.cards : [];
    const cards = ZONE_A.map((lang) => {
      const found = pickCard(cardsIn, lang);
      return found
        ? normalizeLanguageCard(found, lang, lockedSense)
        : stubCard(lang, lockedSense);
    });
    const tri = src.triangle && typeof src.triangle === 'object' ? src.triangle : {};
    const falseFriends = Array.isArray(tri.falseFriends)
      ? tri.falseFriends
          .map((f) => {
            if (!f || typeof f !== 'object') return null;
            const form = String(f.form || '').trim();
            if (!form) return null;
            return {
              form,
              zhSense: String(f.zhSense || '').trim(),
              jaOrKoSense: String(f.jaOrKoSense || '').trim(),
              noteZh: String(f.noteZh || '').trim(),
            };
          })
          .filter(Boolean)
      : [];
    return {
      zone: 'A',
      lockedSense: lockedSense,
      cards,
      triangle: {
        sharedHanzi: String(tri.sharedHanzi || '—').trim() || '—',
        falseFriends,
        literaryVsColloquialZh: String(tri.literaryVsColloquialZh || '').trim(),
        summaryZh: String(tri.summaryZh || '').trim(),
      },
    };
  }

  function normalizeZoneB(raw, lockedSense) {
    const src = raw && typeof raw === 'object' ? raw : {};
    const cardsIn = Array.isArray(src.cards) ? src.cards : [];
    const cards = ZONE_B.map((lang) => {
      const found = pickCard(cardsIn, lang);
      return found
        ? normalizeLanguageCard(found, lang, lockedSense)
        : stubCard(lang, lockedSense);
    });
    const net = src.cognateNet && typeof src.cognateNet === 'object' ? src.cognateNet : {};
    const asList = (v) =>
      (Array.isArray(v) ? v : []).map((x) => String(x || '').trim()).filter(Boolean);
    const traps = Array.isArray(net.traps)
      ? net.traps
          .map((t) => {
            if (!t || typeof t !== 'object') return null;
            const form = String(t.form || '').trim();
            if (!form) return null;
            return { form, noteZh: String(t.noteZh || '').trim() };
          })
          .filter(Boolean)
      : [];
    return {
      zone: 'B',
      lockedSense: lockedSense,
      cards,
      cognateNet: {
        germanic: asList(net.germanic),
        romance: asList(net.romance),
        traps,
        summaryZh: String(net.summaryZh || '').trim(),
      },
    };
  }

  function digestZoneA(zoneA) {
    if (!zoneA) return '';
    const lock = (zoneA.lockedSense && zoneA.lockedSense.glossZh) || '';
    const byLang = {};
    (zoneA.cards || []).forEach((c) => {
      if (c && c.lang) byLang[c.lang] = c;
    });
    function line(code, label) {
      const c = byLang[code];
      if (!c) return `${label} — [gap]`;
      const hw = (c.primary && c.primary.headword) || '—';
      const hanja = code === 'ko' && c.primary && c.primary.hanja ? ` (${c.primary.hanja})` : '';
      const extra = (c.caveatsZh || (c.primary && c.primary.glossZh) || '').trim();
      return `${label} ${hw}${hanja} [${c.equiv || 'approx'}] ${extra}`;
    }
    const text = [`鎖: ${lock}`, line('zh', 'ZH'), line('ko', 'KO'), line('ja', 'JA')].join('\n');
    return text.slice(0, 800);
  }

  /**
   * Detect fixtures from the design doc. Returns [] if all pass.
   */
  function selfCheckDetect() {
    const cases = [
      ['aimer', 'fr'],
      ['dire', 'fr'],
      ['faire', 'fr'],
      ['parlare', 'it'],
      ['Liebe', 'de'],
      ['amor', 'en'],
      ['mal du pays', 'fr'],
      ['love', 'en'],
      ['사랑', 'ko'],
      ['郷愁', 'zh'],
    ];
    return cases
      .filter(([q, expect]) => detectSourceLang(q) !== expect)
      .map(([q, expect]) => ({ q, expect, got: detectSourceLang(q) }));
  }

  VO.schema = {
    LANG_ORDER,
    ZONE_A,
    ZONE_B,
    BOARD_CJK,
    BOARD_EU,
    EQUIV,
    DOMAINS,
    normalizeQuery,
    normalizePos,
    fnv1aHex,
    mintSenseKey,
    detectSourceLang,
    needsSourceHint,
    effectiveSourceLang,
    normalizeSenseList,
    normalizeLanguageCard,
    normalizeZoneA,
    normalizeZoneB,
    digestZoneA,
    stubCard,
    checkDrift,
    selfCheckDetect,
  };
})(typeof window !== 'undefined' ? window : globalThis);

(function (global) {
  const VA = (global.VerbaAthanor = global.VerbaAthanor || {});

  const LANGS = {
    fr: {
      id: 'fr',
      label: { zh: '法語', native: 'Français' },
      targetLang: 'Modern French (le français moderne)',
      ttsLang: 'fr-FR',
      ttsCode: 'fr',
      normalize: 'latin-accents',
      gender: true,
      eraDefault: 'Fr',
      originHints: 'PIE Lat VL OF MF Fr Gk AN It Sp Prov Ar Gaul',
      placeholder: '投入一個法語詞…',
      tag: "L'athanor des mots",
      modernWordHint: '若這是法語詞，可再投入爐中',
      ipaHint: '用法語 IPA',
      theme: 'fleur',
      bedSrc: 'audio/alchemists-dawn.mp3',
      crucibleHint: 'Solve et coagula',
      extraRules:
        'Handle French accents. Gender required for nouns/adjectives (m|f|mf). Verbs: lemma = infinitive. Distinguish popular French vs learned Latin doublets (croire / crédible). Compounds like parapluie = para- + pluie.',
      honestyExtra: `- 通俗法語詞與書面拉丁雙重詞要分開（croire vs crédible/crédit）。
- 複合詞拆真正構詞（parapluie = para- + pluie；aujourd'hui = au + jour + d' + hui）。
- 看得見的派生後綴要拆，即使詞根不能單用：soudain = soud- + -ain（← subitus + -ānus）；certain = cert- + -ain；hauteur = haut + -eur。禁止把整詞做成唯一一枚 kind=oth。
- 動詞用不定詞當 lemma；形容詞用陽性單數（或 mf）；名詞給陰陽性。
- origin 短碼：PIE Lat VL OF MF Fr Gk It Ar Gaul。通俗詞 path 必須含 Lat→VL→OF→MF→Fr，禁止跳過通俗拉丁／古法語。
- firstAttested 用 TLFi／FEW 通行首見；年份不確定就寫世紀（12c）。作者與著作有通行出處就填（如 Du Bellay《La Deffence》），不知留空、禁止瞎編。這是本詞書面首見，不是 PIE 原鄉。
- 禁止把英文詞當法語派生。
- glossFr／meaningFr 填法語釋義。ipa 用法語 IPA。gender：名詞／形容詞 m|f|mf，動詞空字串。
- 例：in- →「否定」；croy →「相信」；-able →「可被…的」。`,
    },
    en: {
      id: 'en',
      label: { zh: '英語', native: 'English' },
      targetLang: 'Modern English',
      ttsLang: 'en-US',
      ttsCode: 'en',
      normalize: 'latin-basic',
      gender: false,
      eraDefault: 'ModE',
      originHints: 'OE ME EModE ModE OF AN Lat Gk PGmc ON Du Ger',
      placeholder: '投入一個英語詞…',
      tag: 'The athanor of words',
      modernWordHint: '若這是英語詞，可再投入爐中',
      ipaHint: '用英語 IPA',
      theme: 'west',
      bedSrc: 'audio/alchemists-dawn.mp3',
      crucibleHint: 'Solve et coagula',
      extraRules:
        'No grammatical gender. Verbs: lemma = infinitive/base. Distinguish Germanic popular vs Latinate learned doublets (believe / credible; do / fact). True compounds (sunflower = sun + flower). Do not split syllables as morphemes.',
      honestyExtra: `- 日耳曼通俗詞與拉丁／法語書面雙重詞要分開（believe vs credible；do vs fact）。
- 複合詞拆真正構詞（sunflower = sun + flower；raincoat = rain + coat）。
- 動詞用原形 lemma；形容詞用原級。gender 一律空字串。
- origin 短碼：PIE PGmc OE ME EModE ModE OF AN Lat Gk ON Du Ger。日耳曼通俗詞 path 必須含 PGmc→OE→ME→EModE→ModE，禁止跳步。
- firstAttested 用 OED 通行首見；年份不確定就寫世紀（14c）。作者與著作有通行出處就填（如 John Gerard《The Herball》），不知留空、禁止瞎編。這是本詞書面首見，不是 PIE 原鄉。
- 禁止把法語詞當英語派生（確為借詞須註明）。
- glossFr／meaningFr 欄位填英語釋義（欄位名沿用）。
- ipa 只填現代英語國際音標一次（如 /bɪˈliːv/），禁止把古英語／中古英語讀音、歷史音變清單寫進 ipa 或 path.form。
- path.form 用歷史拼寫（geliefan、beleven、believe），不是 IPA。
- 例：un- →「否定」；believe →「相信」；-able →「可被…的」。`,
    },
    ja: {
      id: 'ja',
      label: { zh: '日語', native: '日本語' },
      targetLang: 'Modern Japanese (標準語)',
      ttsLang: 'ja-JP',
      ttsCode: 'ja',
      normalize: 'ja',
      gender: false,
      eraDefault: 'ModJ',
      originHints: 'OJ MidJ ModJ Ch Onyomi Kun Native Sino Wago Gairaigo',
      placeholder: '投入一個日語詞…',
      tag: '言靈の丹房',
      modernWordHint: '若這是日語詞，可再投入爐中',
      ipaHint: 'reading 用假名或 IPA',
      theme: 'xian',
      bedSrc: 'audio/beneath-the-sacred-peak.mp3',
      crucibleHint: '煉丹 · 言靈',
      extraRules:
        'Lemma = dictionary form (辞書形). Split into smallest morphemes (漢字・語根・接辞・活用), not just mora. Mark 漢語/和語/外来語. Kanji morphemes may use kind han. Verb stems kind stem; inflections infl (godan/ichidan). Do not invent 漢字. If on/kun uncertain, say 存疑.',
      honestyExtra: `- 拆到最小有意義單位：漢字、語根、接辭、活用，不是拍（mora）。
- 標 漢語／和語／外来語。漢字語素 kind 可用 han；動詞語幹 stem；活用 infl。
- lemma 用辭書形（食べる、開く、高い）。gender 空字串。
- origin 短碼：OJ MidJ ModJ Ch Onyomi Kun Native Sino。音讀寫 Onyomi，勿寫 On（On 是古諾斯語）。
- firstAttested 寫本詞書面首見（上代／中世／明治），不是漢字在中國的起源。著作可知則填（如《万葉集》《源氏物語》），不知留空。
- glossFr／meaningFr 填日語釋義（可用假名或漢字）。ipa 欄填假名讀音（如 としょかん）。
- 例：不 →「否定」；可能 →「可能」；図書館＝図書＋館。
- 禁止把中文詞直接當日語派生（同形漢字須註明日語讀音與義）。`,
    },
    ko: {
      id: 'ko',
      label: { zh: '韓語', native: '한국어' },
      targetLang: 'Modern Korean (표준어)',
      ttsLang: 'ko-KR',
      ttsCode: 'ko',
      normalize: 'ko',
      gender: false,
      eraDefault: 'MK',
      originHints: 'OK SK MK Ch Hanja Native Sino Eng Jap',
      placeholder: '投入一個韓語詞…',
      tag: '말의 서원',
      modernWordHint: '若這是韓語詞，可再投入爐中',
      ipaHint: 'reading 用諺文或羅馬字',
      theme: 'seowon',
      bedSrc: 'audio/beneath-the-sacred-peak.mp3',
      crucibleHint: '丹靑 · 言靈',
      extraRules:
        'Lemma = dictionary form (하다 verbs keep 하다). Split into smallest morphemes: 한자어 roots, 고유어 stems, 접사, 하다. Mark 한자어/고유어/외래어. Hanja morphemes kind han. Do not invent Hanja; omit if uncertain. Native words must not be fake-split into syllables.',
      honestyExtra: `- 拆到最小有意義單位：漢字詞根、固有語語幹、接辭、하다，不是音節。
- 標 한자어／고유어／외래어。漢字語素 kind 可用 han。
- lemma 用辭書形（공부하다、예쁘다、도서관）。gender 空字串。
- origin 短碼：OK SK MK Ch Hanja Native Sino Eng Jap。
- firstAttested 寫本詞在韓語文獻的首見，不是漢字在中國的起源。作者與著作可知則填，不知留空。
- glossFr／meaningFr 填韓語釋義（諺文）。ipa 欄填羅馬字或諺文讀音。
- 例：불 →「否定」；가능 →「可能」；도서관＝도서＋관。
- 固有語不要硬拆音節。Hanja 不確定就留空，禁止瞎編。`,
    },
  };

  function currentId() {
    const stored = VA.storage?.loadSettings?.().lang;
    if (stored && LANGS[stored]) return stored;
    return 'fr';
  }

  function current() {
    return LANGS[currentId()] || LANGS.fr;
  }

  function setLang(id) {
    if (!LANGS[id]) return current();
    if (VA.storage?.saveSettings) VA.storage.saveSettings({ lang: id });
    return LANGS[id];
  }

  function list() {
    return Object.values(LANGS);
  }

  VA.langs = { LANGS, currentId, current, setLang, list };
})(typeof window !== 'undefined' ? window : globalThis);

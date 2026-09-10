/**
 * Verba Orbis prompt templates (file:// safe)
 */
(function (global) {
  const VO = (global.VerbaOrbis = global.VerbaOrbis || {});

  const NON_EQUIVALENCE = `【對等規則 — 禁止假 1:1】
- equiv 必填：exact | narrower | wider | split | approx | gap。不確定時用 approx，不要用 exact。
- 若該語言沒有對應「已鎖定義」的單一詞，equiv 必須是 gap 或 approx 或 split，並明白寫「沒有一詞之譯」。
- 禁止生造詞典裡不存在的對譯（例如為了填格子而寫一個沒人用的漢語直譯外來詞）。
- 禁止把另一義的常用對譯當成這一義的主詞。
- 禁止把拼音、羅馬字、或漢字轉寫偽造成該語言的詞。
- 語源務必誠實：不確定的 cognate 加「可能／存疑」；禁止把偶然同形（love / 愛）寫成同源。
- 漢字圈：韓語必須標 한자어/고유어/외래어；日語必須標 漢語/和語/外来語 與 音讀/訓讀。Hanja/漢字不確定就留空，禁止瞎編。
- 只輸出一個 JSON 物件。不要 markdown、不要代碼圍欄、不要前言。`;

  function lockedSenseBlock(sense) {
    const s = sense || {};
    return `【已鎖定義項 — 禁止改義】
- senseId: ${s.id || ''}
- 查詢形: ${s.query || ''}
- 來源語: ${s.sourceLang || ''}
- 詞性: ${s.pos || ''}
- 中文義鎖: ${s.glossZh || ''}
- 語域: ${s.domain || ''}
規則：八語卡片必須對準「中文義鎖」。若某語言的常用對譯其實對應另一義（例如法語 aimer 也表「喜歡」），不得把該語言主詞改成另一義。同形異義、範圍較窄／較寬、需拆詞、無對等，只用 caveatsZh 一句（≤40字）說明差在哪。exact 則 caveatsZh 留空。`;
  }

  const SENSE_SYSTEM = `你是跨語言詞義助理（Verba Orbis）。任務：為使用者的查詢列出「需要分開比較」的義項。
只輸出一個 JSON。解釋語言：繁體中文。
candidates 2–6 項；若確實只有一義，仍輸出 1 項。
每個義項必須能讓學習者在不查詞典的情況下做選擇：詞性、一行中文義、語域。
id 必須是 s1, s2, … 依序。
語域只能是：日常、文學、書面、宗教、哲學、口語、術語、古語。
詞性短碼：n v adj adv prep conj pron prt phr idiom（可 n/v）。
不要做八語翻譯。不要選「最常見義」當唯一答案。`;

  function senseUser({ query, detected, sourceLang, effectiveSourceLang }) {
    return `查詢：${query}
來源語（偵測=${detected}，使用者覆寫=${sourceLang}）：${effectiveSourceLang}
請列出義項。

輸出 schema：
{
  "query": string,
  "detectedSourceLang": "zh"|"ko"|"ja"|"en"|"de"|"es"|"fr"|"it",
  "candidates": [
    {
      "id": "s1",
      "pos": "n",
      "glossZh": "一行繁中義，≤40字",
      "domain": "日常",
      "headwordHint": "建議辭書形",
      "note": "可空"
    }
  ]
}`;
  }

  const ZONE_A_SYSTEM = `你是漢語／韓語／日語對比的詞條作者（Verba Orbis · Zone A）。
讀者是以繁體中文做筆記的學習者。文風：短詞條，與歐語圈同一密度，不是論文。
固定語言順序：中文 → 韓語 → 日語。
${NON_EQUIVALENCE}
你必須先讀「已鎖定義項」。這一區只處理鎖定義。`;

  function zoneAUser(lockedSense) {
    return `${lockedSenseBlock(lockedSense)}

請產生 Zone A JSON：
{
  "zone": "A",
  "cards": [
    {
      "lang": "zh",
      "equiv": "exact",
      "primary": {
        "headword": "",
        "reading": "",
        "hanja": "",
        "glossZh": "一行繁中核心義，必須對準已鎖定義",
        "pos": "n",
        "register": "中性",
        "gender": "",
        "isPhrase": false
      },
      "etymologyZh": "",
      "sinoClass": "hanja|native|loan|mixed",
      "jpClass": "kango|wago|gairaigo|mixed",
      "jpReadingType": "on|kun|mixed|na",
      "caveatsZh": ""
    }
  ]
}

約束：
- cards 必須恰好 3 張，lang 依序 zh, ko, ja。
- 每卡 primary.headword 必填真實辭書形（中文「鄉愁」、韓語「향수」、英語「oath」）。禁止填空白、「—」、或只把詞丟進 plural。
- 每卡 primary.glossZh 必填（一行繁中核心義，對準鎖定義）。這是 UI「核心義」與漂移檢查的欄位。
- zh 卡：不要填 sinoClass/jpClass。
- ko 卡：sinoClass 必填。primary.headword = 한글（향수），primary.hanja = 漢字（鄕愁，不確定就 ""），primary.reading = 羅馬化（hyangsu）。
- ja 卡：jpClass、jpReadingType 必填。
- 不要寫 hanziRelationZh、semanticRangeZh。
- 不要輸出 alternatives、example、triangle。
- caveatsZh：僅當 equiv 不是 exact 時寫一句（≤40字），說明這詞比鎖定義窄／寬／需拆／無對等／同形另有他義。exact 留空。
- etymologyZh：一兩句，20–50 字。只寫本詞怎麼來，不要展開漢字圈對照長文。
- 中文卡 primary.reading 必須是帶調號拼音（xiāngchóu），禁止數字調（xiang1chou2）。`;
  }

  const ZONE_B_SYSTEM = `你是拉丁語與英語／德語／西班牙語／法語／義大利語對比的詞條作者（Verba Orbis · Zone B）。
讀者是以繁體中文做筆記的學習者。文風：短詞條，與漢字圈同一密度。
固定語言順序：英語 → 德語 → 西班牙語 → 法語 → 義大利語 → 拉丁語。
拉丁語是歐語圈的共同軸（羅曼語多由此分出；日耳曼語多為借譯或平行）。
${NON_EQUIVALENCE}
先讀「已鎖定義項」與「漢字圈摘要」。歐洲語言與拉丁語的主詞必須對準同一鎖定義，不要被 Zone A 的漢字詞表面帶走，也不要滑到該詞的其他義。
特別檢查：法語 aimer（愛／喜歡）、西語 amar/querer、德語 lieben/gern haben、義語 amare/voler bene。
de/es/fr/it/la 名詞與形容詞必須填 gender（m|f|n|mf|inv）。德語名詞盡量給 plural。拉丁名詞給性別與屬格（plural 欄可寫 gen.）。`;

  function zoneBUser(lockedSense, zoneADigest) {
    return `${lockedSenseBlock(lockedSense)}

【漢字圈已生成摘要 — 僅供對齊，不要改義】
${zoneADigest || '（無摘要）'}

請產生 Zone B JSON：
{
  "zone": "B",
  "cards": [ /* 6 cards: en de es fr it la, same LanguageCard shape as Zone A */ ]
}

約束：
- cards 必須恰好 6 張，lang 依序 en, de, es, fr, it, la。
- 每卡 primary.headword 必填真實辭書形（oath / Eid / juramento / serment / giuramento / iūsiūrandum）。禁止空白或「—」。複數只寫 plural。
- 拉丁卡 lang 必須是 "la"。primary.reading 可用長音符號（iūsiūrandum）。不要填 ipa。
- en/de/es/fr/it：primary.ipa 必填寬式 IPA（如 hoʊmˈsɪknəs、niˈeβe、mal dy pɛ）。不要加斜線，UI 會加。不要用拼讀或一般注音代替。拉丁與漢字圈不要填 ipa。
- 每卡 primary.glossZh 必填。
- 不要寫 hanziRelationZh、semanticRangeZh。
- 不要填 sinoClass / jpClass。
- 不要輸出 alternatives、example、cognateNet。
- caveatsZh：僅當 equiv 不是 exact 時寫一句（≤40字），說明這詞比鎖定義窄／寬／需拆／無對等／同形另有他義。exact 留空。不要寫用法百科。
- etymologyZh：一兩句，20–50 字。羅曼語與拉丁的關係可寫在語源。`;
  }

  const CONTINUE_JSON = '上次輸出不是合法 JSON。請只輸出完整 JSON，不要重複解說。';

  VO.prompts = {
    NON_EQUIVALENCE,
    lockedSenseBlock,
    SENSE_SYSTEM,
    senseUser,
    ZONE_A_SYSTEM,
    zoneAUser,
    ZONE_B_SYSTEM,
    zoneBUser,
    CONTINUE_JSON,
  };
})(typeof window !== 'undefined' ? window : globalThis);

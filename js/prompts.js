(function (global) {
  const VA = (global.VerbaAthanor = global.VerbaAthanor || {});

  const ANALYZE_SCHEMA = {
    type: 'object',
    additionalProperties: false,
    required: [
      'word',
      'lemma',
      'ipa',
      'pos',
      'gender',
      'glossZh',
      'glossFr',
      'alchNoteZh',
      'morphemes',
      'path',
      'firstAttested',
      'example',
    ],
    properties: {
      word: { type: 'string' },
      lemma: { type: 'string' },
      ipa: { type: 'string' },
      pos: { type: 'string' },
      gender: { type: 'string' },
      glossZh: { type: 'string' },
      glossFr: { type: 'string' },
      alchNoteZh: { type: 'string' },
      firstAttested: {
        type: 'object',
        additionalProperties: false,
        required: ['year', 'era', 'form', 'whereZh', 'sourceZh', 'author', 'work', 'certainty'],
        properties: {
          year: { type: 'string' },
          era: { type: 'string' },
          form: { type: 'string' },
          whereZh: { type: 'string' },
          sourceZh: { type: 'string' },
          author: { type: 'string' },
          work: { type: 'string' },
          certainty: { type: 'string' },
        },
      },
      morphemes: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: [
            'id',
            'surface',
            'kind',
            'meaningZh',
            'meaningFr',
            'origin',
            'originForm',
            'originPath',
            'noteZh',
          ],
          properties: {
            id: { type: 'string' },
            surface: { type: 'string' },
            kind: { type: 'string', enum: ['pfx', 'root', 'sfx', 'cf', 'infl', 'oth', 'han', 'stem'] },
            meaningZh: { type: 'string' },
            meaningFr: { type: 'string' },
            origin: { type: 'string' },
            originForm: { type: 'string' },
            originPath: { type: 'string' },
            noteZh: { type: 'string' },
          },
        },
      },
      path: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['era', 'lang', 'form', 'glossZh', 'via', 'noteZh', 'certainty'],
          properties: {
            era: { type: 'string' },
            lang: { type: 'string' },
            form: { type: 'string' },
            glossZh: { type: 'string' },
            via: { type: 'string' },
            noteZh: { type: 'string' },
            certainty: { type: 'string' },
          },
        },
      },
      example: {
        type: 'object',
        additionalProperties: false,
        required: ['fr', 'zh'],
        properties: {
          fr: { type: 'string' },
          zh: { type: 'string' },
        },
      },
    },
  };

  const EXPAND_SCHEMA = {
    type: 'object',
    additionalProperties: false,
    required: ['op', 'seed', 'items'],
    properties: {
      op: { type: 'string', enum: ['distill', 'derive', 'compound'] },
      seed: { type: 'string' },
      items: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['word', 'kind', 'pos', 'glossZh', 'linkZh', 'era'],
          properties: {
            word: { type: 'string' },
            kind: { type: 'string' },
            pos: { type: 'string' },
            glossZh: { type: 'string' },
            linkZh: { type: 'string' },
            era: { type: 'string' },
          },
        },
      },
    },
  };

  let packLang = null;

  function pack() {
    const id = packLang || VA.langs?.currentId?.() || 'fr';
    return (VA.langs?.LANGS && VA.langs.LANGS[id]) || VA.langs?.current?.() || { id: 'fr', targetLang: 'Modern French', extraRules: '', honestyExtra: '', ipaHint: 'IPA' };
  }

  function usingLang(id, fn) {
    const prev = packLang;
    packLang = id || null;
    try {
      return fn();
    } finally {
      packLang = prev;
    }
  }

  function honesty() {
    const p = pack();
    return `【誠實規則】
- 目標語：${p.targetLang}。只分析這個語言的詞。
- 拆到最小「有意義的語素」，不是音節。能看見的派生後綴／前綴必須拆開，即使詞根是黏著的、不能單獨成詞。
- 禁止把整詞複製成唯一一枚 kind=oth 的語素。真的不能拆（單語素根如 jour、sun、雨）才只給 1 枚，kind 用 root。
- 前綴／詞根／後綴／構詞成分分清楚。屈折詞尾標 infl。
- 所有說明用繁體中文。詞形本身保持該語言／拉丁／希臘／PIE 原形。
${p.honestyExtra || ''}
${p.extraRules ? '- ' + p.extraRules : ''}
【語素／詞根註釋 — 與整詞同等重要，禁止空白】
- 每個 morpheme 必填 meaningZh（此語素自己的中文核心義，2–16字）、meaningFr（目標語釋義）、noteZh、originPath。
- meaningZh 禁止只寫「前綴／詞根／後綴」，禁止複製整詞的 glossZh，禁止空字串。
- originPath 格式固定：「ERA form → ERA form → …」，例：PIE *ḱred-dʰeh₁- → Lat credere → VL *credere → OF croire。同一語素永遠寫同一條鏈。
- noteZh 寫這枚語素自己的來源（音變／借詞／構詞），20–80字，禁止空白。
- 每個 path 步驟必填 glossZh 與 noteZh。派生／複合／蒸餾每一項也必填 glossZh。
【詞源路徑 path — 必須詳細、穩定、不跳步】
- 由最古到今。能到 PIE 就到；不確定則 certainty=reconstructed，glossZh 加「存疑」。禁止瞎編 PIE。
- 時代只准用短碼，禁止寫全名：PIE PIt PGmc Gk Lat VL OF MF Fr OE ME EModE ModE AN ON It Sp Ar Gaul OJ MidJ ModJ Ch OCH Native Sino OK SK MK。
- 中間階段能列就列，禁止跳步。最短 3 步，典型 5–8 步。
  法語通俗：PIE（若穩）→ Lat → VL → OF → MF → Fr
  法語書面：Lat 或 Gk → Fr（via=learned）
  英語日耳曼：PIE（若穩）→ PGmc → OE → ME → EModE → ModE
  英語拉丁／法語：Lat/Gk → OF/AN（若經法語）→ ME → ModE
  日語漢語：Ch → MidJ → ModJ；和語：OJ → MidJ → ModJ
  韓語漢字：Ch → SK → MK；固有語：OK → SK → MK
- via 只能是：inherit（繼承）borrow（借詞）learned（書面借入）popular（通俗音變）calque（仿譯）reconstruct（構擬）compound（合劑）
- certainty 只能是：certain | probable | reconstructed
- 每一步 noteZh 寫「如何從上一步變成這一步」（音變／語義／構詞），20–80字。禁止只重複 glossZh。
- PIE 只用 Wiktionary／LIV 通行構擬，一律 * 開頭。禁止同一詞換一套構擬。
【穩定性 — 同一 lemma 永遠同一答案】
- 同一詞永遠用同一套語素切開、同一套 path、同一條 originPath、同一套 PIE、同一套 firstAttested。
- 只採教科書／Wiktionary 主條，不要列替代構擬或少數說。
- 語素 surface 用構詞可見形（croy / in- / -able），不要每次改切法。
【最早出現 firstAttested — 本詞 lemma 的書面首見，不是 PIE 原鄉、不是詞根史前起源地】
- year：有通行年份寫四位數（1549）；只有世紀寫 12c、17c。禁止每次換年份。
- era：首見時代短碼（OF MF Fr OE ME EModE ModE OJ MidJ ModJ SK MK…）。
- form：當時寫下的詞形。
- whereZh：固定「地區或語種，文獻類型」，如「法國書面語」「古英語文獻」「日本上代文獻」。≤40字。
- author：首見文獻的作者通行名（Du Bellay、Rabelais、紫式部、John Gerard）。不知則空字串。禁止瞎編作者。
- work：首見著作名（La Deffence et Illustration de la Langue Françoyse、万葉集、The Herball）。不知則空字串。禁止瞎編書名。
- 作者或書名只要辭書／教科書有通行出處，就一定要填；只知其一就只填其一。匿名總集只填 work（如 万葉集）。
- sourceZh：通行辭書（TLFi、OED、FEW、日本国語大辞典），不要把作者書名寫進 sourceZh。不知則空字串。
- certainty：確切年份有辭書共識才用 certain，其餘 probable。
- 這是「這個字」被寫下來的最早紀錄。同一 lemma 永遠同一套 year／whereZh／author／work。`;
  }

  function analyzeSystem() {
    const p = pack();
    return `你是${p.label?.zh || ''}歷史形態學與詞源煉金術士（Verba Athanor）。
任務：把「一個${p.targetLang}詞」分解成最小語素，給出由古到今的詞源路徑，並註明這個字最早寫在哪裡。
讀者是以繁體中文做筆記的學習者。文風可以略帶煉金術隱喻，但語源必須學術誠實。
${honesty()}
只輸出一個 JSON 物件。`;
  }

  function analyzeUser(word, { forceSplit } = {}) {
    const p = pack();
    const split = forceSplit
      ? `
【再切開】上一爐把這個詞當成一整塊。這次必須拆成 2 枚以上語素（詞根＋後綴，或前綴＋詞根等）。
禁止只輸出 1 枚且 surface 等於整詞。黏著詞根也要給出來（如 soudain → soud- + -ain）。
現代形式仍看得出的派生後綴（法語 -ain/-aine/-eur/-eux/-té/-tion/-able/-al/-ique/-ment；英語 -ly/-ness/-ful/-less/-hood；日語接辭／漢字）必須拆開。`
      : '';
    return `投入爐中的詞：${word}
目標語：${p.targetLang}
${split}

請分析。若這是變位／複數／屈折形，lemma 寫辭書形，word 可保留輸入形。
morphemes 1–6 個。能拆就拆：看得見的前綴、後綴、構詞成分都要單獨成枚，詞根即使不能單用也要留下。
只有單語素根（前綴、後綴、漢字、語幹、構擬形、真正沒有內部結構的詞根）才只給 1 枚；禁止硬拆字母或音節。
path 4–8 步（最古→今；歷史極短才可 3 步）。每步填 era、lang（=era 短碼）、form、glossZh、via、noteZh、certainty。
整詞要有 glossZh／glossFr；每一枚語素要有獨立的 meaningZh／meaningFr／noteZh／originPath（這是重點：詞根來源鏈寫在 originPath）。
alchNoteZh：一句煉金術式的中文，解釋這些語素如何「煉」成這個意思（≤80字）。
firstAttested：這個字（lemma）最早寫在哪裡。year／era／form／whereZh／sourceZh／author／work／certainty 必填；author、work、sourceZh 不知則空字串，可知就填（哪位作者、哪本書）。
${p.ipaHint || ''}。ipa 只填當代讀音一次，不要列歷史讀音。path.form 是詞形／拼寫，不是音標。
pos 短碼：n v adj adv prep conj pron phr idiom。
請給穩定、可重複的標準答案，不要每次換切法、換構擬或換首見年份。`;
  }

  const FILL_SCHEMA = {
    type: 'object',
    additionalProperties: false,
    required: ['glossZh', 'glossFr', 'morphemes', 'path', 'firstAttested'],
    properties: {
      glossZh: { type: 'string' },
      glossFr: { type: 'string' },
      firstAttested: {
        type: 'object',
        additionalProperties: false,
        required: ['year', 'era', 'form', 'whereZh', 'sourceZh', 'author', 'work', 'certainty'],
        properties: {
          year: { type: 'string' },
          era: { type: 'string' },
          form: { type: 'string' },
          whereZh: { type: 'string' },
          sourceZh: { type: 'string' },
          author: { type: 'string' },
          work: { type: 'string' },
          certainty: { type: 'string' },
        },
      },
      morphemes: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['id', 'surface', 'meaningZh', 'meaningFr', 'noteZh', 'originPath'],
          properties: {
            id: { type: 'string' },
            surface: { type: 'string' },
            meaningZh: { type: 'string' },
            meaningFr: { type: 'string' },
            noteZh: { type: 'string' },
            originPath: { type: 'string' },
          },
        },
      },
      path: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['era', 'form', 'glossZh', 'via', 'noteZh', 'certainty'],
          properties: {
            era: { type: 'string' },
            form: { type: 'string' },
            glossZh: { type: 'string' },
            via: { type: 'string' },
            noteZh: { type: 'string' },
            certainty: { type: 'string' },
          },
        },
      },
    },
  };

  function fillSystem() {
    const p = pack();
    return `你是${p.label?.zh || ''}詞源註釋員（Verba Athanor）。任務：為已經拆好的語素與歷史形式補上中文意思與來源說明。
meaningFr 填${p.targetLang}釋義。每個語素寫它自己的意義，不要重複整詞的釋義。
整詞 glossZh 必填繁體中文意思。語素 meaningZh、path.glossZh 也必須是繁體中文，禁止只填外文。
path 每步補 glossZh、via、noteZh（如何演變）、certainty。語素補 originPath（ERA form → ERA form）。
firstAttested 補這個字書面首見（year／era／form／whereZh／sourceZh／author／work／certainty）。作者與著作可知就填，不知留空，禁止瞎編。
禁止空白。只輸出一個 JSON。`;
  }

  function fillUser(analysis) {
    const morphs = (analysis.morphemes || [])
      .map(
        (m) =>
          `- id=${m.id} surface=${m.surface} kind=${m.kind} origin=${m.origin} ${m.originForm || ''} originPath=${m.originPath || '（缺）'} 現有：${m.meaningZh || '（缺）'}`
      )
      .join('\n');
    const path = (analysis.path || [])
      .map((p) => `- ${p.era} ${p.form} via=${p.via || '（缺）'} 現有：${p.glossZh || '（缺）'} note=${p.noteZh || '（缺）'}`)
      .join('\n');
    const att = analysis.firstAttested || {};
    return `整詞：${analysis.lemma}（${analysis.glossZh || ''}）
整詞現有 glossZh：${analysis.glossZh || '（缺）'}
請為整詞與下列語素、詞源步驟補上繁體中文意思。整詞 glossZh、每個語素 meaningZh、每條 path.glossZh 都必須含漢字，禁止只寫外文或空白。originPath 用「ERA form → ERA form」。via 用 inherit/borrow/learned/popular/calque/reconstruct/compound。certainty 用 certain/probable/reconstructed。
並補 firstAttested（本詞書面首見，不是 PIE 原鄉）：year=${att.year || '（缺）'} era=${att.era || '（缺）'} form=${att.form || '（缺）'} whereZh=${att.whereZh || '（缺）'} author=${att.author || '（缺）'} work=${att.work || '（缺）'} sourceZh=${att.sourceZh || '（缺）'}。year 用 1549 或 12c；whereZh 用「法國書面語」這類固定格式。author／work 是首見的作者與書名，辭書有通行出處就填，不知則空字串。

語素：
${morphs || '（無）'}

詞源路徑：
${path || '（無）'}`;
  }

  function expandSystem(op) {
    const p = pack();
    const task =
      op === 'distill'
        ? `沿這枚語素／詞根回推更早的形式，給出「標準來源鏈」（不是隨意同源詞）。每項 word 是歷史形式，era 用固定短碼（${p.originHints}），kind 用 root 或 source。由較近到較古排列。必須與該語素 originPath／整詞 path 使用同一套歷史形式與構擬，禁止另給一套。linkZh 寫該步如何演變（音變／借詞／構詞），不要只寫「拉丁原質」。`
        : op === 'compound'
          ? `列出真正的${p.label?.zh || ''}複合詞。不要把普通派生（-able/-tion/-ness）假裝成複合。`
          : `列出現代${p.label?.zh || ''}中共用這枚語素的派生詞（含通俗詞與書面詞，若兩者都存在）。優先常見詞。`;
    return `你是${p.label?.zh || ''}詞源煉金術士（Verba Athanor）。任務：從一枚已析出的語素做「${op}」。
目標語：${p.targetLang}
${task}
${honesty()}
每項 4–8 個。derive 給現代${p.label?.zh || ''}裡真正帶這枚語素的詞；compound 給真正的複合／合劑。前綴、詞根、漢字、構詞成分通常都有常見例，不要無故回空陣列。沒有任何誠實例子才用空陣列。
只輸出一個 JSON 物件。`;
  }

  function expandUser({ op, seed, morph, word, analysis }) {
    const p = pack();
    const m = morph || {};
    return `操作：${op}
當前${p.label?.zh || ''}詞：${word || analysis?.lemma || ''}
語素表面：${seed || m.surface}
kind：${m.kind || ''}
意義：${m.meaningZh || ''} / ${m.meaningFr || ''}
來源：${m.origin || ''} ${m.originForm || ''}
來源鏈：${m.originPath || ''}
筆記：${m.noteZh || ''}

請列出 ${op} 的析出物。
distill 時 word=歷史形式，era 用短碼（${p.originHints}），glossZh=該形式意義，linkZh=如何從較近一步變來（20–60字）。覆蓋標準中間階段（法語通俗含 VL/OF/MF；英語日耳曼含 PGmc/OE/ME）。同一語素永遠同一條鏈。
derive/compound 時 word=現代${p.label?.zh || ''}辭書形，era=${p.eraDefault}，pos=詞性，linkZh=與種子語素的關係（一句繁中）。優先最常見、最穩定的例子。
每一項 glossZh 必填（該詞／形式自己的中文意思），禁止空白。`;
  }

  function combineSystem() {
    const p = pack();
    return `你是${p.label?.zh || ''}詞源煉金術士（Verba Athanor）。任務：判斷兩枚語素／詞形能否在現代${p.targetLang}裡煉成真正的複合詞或合劑。
目標語：${p.targetLang}
- 只列真正同時用到這兩枚成分的複合／合劑（詞內可見這兩塊，或構詞上就是 A+B / B+A）。
- 不要把普通派生（只加 -able/-tion/-ness／屈折／否定前綴黏上詞根）假裝成複合。
- 不要為了湊數而編造。沒有誠實例子就回空陣列 items=[]。
- 每項 0–8 個。kind 用 compound。
${honesty()}
只輸出一個 JSON 物件。`;
  }

  function combineUser({ a, b, word, analysis }) {
    const p = pack();
    const one = (m, label) => {
      const x = m || {};
      return `${label}：${x.surface || x.form || ''}
kind：${x.kind || ''}
意義：${x.meaningZh || x.gloss || ''} / ${x.meaningFr || ''}
來源：${x.origin || x.era || ''} ${x.originForm || ''}`;
    };
    return `當前爐上的詞：${word || analysis?.lemma || '（無）'}
${one(a, '試劑甲')}
${one(b, '試劑乙')}

請列出同時用到這兩枚的真正複合詞。
word=現代${p.label?.zh || ''}辭書形，era=${p.eraDefault}，pos=詞性，linkZh=兩者如何結合（一句繁中，如「sun + day」），glossZh=該詞自己的中文意思。
若這兩枚就是當前爐上那個詞的構詞，可以把本詞列為第一項。`;
  }

  VA.prompts = {
    ANALYZE_SCHEMA,
    EXPAND_SCHEMA,
    FILL_SCHEMA,
    analyzeSystem,
    analyzeUser,
    fillSystem,
    fillUser,
    expandSystem,
    expandUser,
    combineSystem,
    combineUser,
    usingLang,
  };
})(typeof window !== 'undefined' ? window : globalThis);

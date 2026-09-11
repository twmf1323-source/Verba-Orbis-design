(function (global) {
  const VA = (global.VerbaAthanor = global.VerbaAthanor || {});

  const ANALYSES = {
    incroyable: {
      demo: true,
      word: 'incroyable',
      lemma: 'incroyable',
      ipa: '/ɛ̃.kʁwa.jabl/',
      pos: 'adj',
      gender: 'mf',
      glossZh: '難以置信的',
      glossFr: 'qui ne peut pas être cru',
      alchNoteZh: '否定的水銀覆上「相信」之金，再以 -able 定形：無法被相信之物。',
      firstAttested: {
        year: '1549',
        era: 'Fr',
        form: 'incroyable',
        whereZh: '法國書面語',
        sourceZh: 'TLFi',
        author: 'Du Bellay',
        work: 'La Deffence et Illustration de la Langue Françoyse',
        certainty: 'probable',
      },
      morphemes: [
        {
          id: 'm_in',
          surface: 'in-',
          kind: 'pfx',
          meaningZh: '否定、相反',
          meaningFr: 'négation',
          origin: 'Lat',
          originForm: 'in-',
          originPath: 'PIE *n̥- → Lat in-',
          noteZh: '拉丁否定前綴，與 PIE *n̥- 同源。在 croi- 前保持 in-，不寫成 im-。',
        },
        {
          id: 'm_croy',
          surface: 'croy',
          kind: 'root',
          meaningZh: '相信',
          meaningFr: 'croire',
          origin: 'OF',
          originForm: 'croire',
          originPath: 'PIE *ḱred-dʰeh₁- → Lat credere → VL *credere → OF croire',
          noteZh: '通俗詞 croire < 拉丁 credere（c- 在 e 前腭化，-d- 脫落）。書面雙重詞見 crédible、crédit。',
        },
        {
          id: 'm_able',
          surface: '-able',
          kind: 'sfx',
          meaningZh: '可被…的',
          meaningFr: 'qui peut être',
          origin: 'Lat',
          originForm: '-abilis',
          originPath: 'Lat -abilis → OF -able → Fr -able',
          noteZh: '拉丁 -abilis 經古法語進入，把動詞煉成被動可能形容詞。',
        },
      ],
      path: [
        {
          era: 'PIE',
          lang: 'PIE',
          form: '*ḱred-dʰeh₁-',
          glossZh: '把心放下、託付（存疑構擬）',
          via: 'reconstruct',
          noteZh: 'Wiktionary／LIV 通行構擬：*ḱred-「心」與 *dʰeh₁-「放置」合煉。',
          certainty: 'reconstructed',
        },
        {
          era: 'Lat',
          lang: 'Lat',
          form: 'credere',
          glossZh: '相信、託付',
          via: 'inherit',
          noteZh: '拉丁動詞：把信任放下。法語 croire 與書面 crédible 的共同源頭。',
          certainty: 'certain',
        },
        {
          era: 'VL',
          lang: 'VL',
          form: '*credere',
          glossZh: '相信',
          via: 'popular',
          noteZh: '通俗拉丁保持同一動詞；重音與元音為後世腭化做準備。',
          certainty: 'probable',
        },
        {
          era: 'OF',
          lang: 'OF',
          form: 'croire',
          glossZh: '相信',
          via: 'popular',
          noteZh: 'c- 在 e 前腭化，介音 -d- 脫落，不定詞定形 croire。',
          certainty: 'certain',
        },
        {
          era: 'MF',
          lang: 'MF',
          form: 'croire',
          glossZh: '相信',
          via: 'inherit',
          noteZh: '中古法語沿用 croire；派生 croyable 已可見。',
          certainty: 'certain',
        },
        {
          era: 'Fr',
          lang: 'Fr',
          form: 'croyable',
          glossZh: '可相信的',
          via: 'inherit',
          noteZh: '語幹 croy- 加 -able（← -abilis）煉成被動可能形容詞。',
          certainty: 'certain',
        },
        {
          era: 'Fr',
          lang: 'Fr',
          form: 'incroyable',
          glossZh: '難以置信的',
          via: 'inherit',
          noteZh: '拉丁否定前綴 in- 覆上 croyable，現代法語定形。',
          certainty: 'certain',
        },
      ],
      example: { fr: "C'est incroyable !", zh: '這真是難以置信！' },
    },
    parapluie: {
      demo: true,
      word: 'parapluie',
      lemma: 'parapluie',
      ipa: '/pa.ʁa.plɥi/',
      pos: 'n',
      gender: 'm',
      glossZh: '雨傘',
      glossFr: 'objet qui protège de la pluie',
      alchNoteZh: '義大利式的「抵擋」與法語的「雨」合劑，煉成擋雨之器。',
      firstAttested: {
        year: '1637',
        era: 'Fr',
        form: 'parapluie',
        whereZh: '法國書面語',
        sourceZh: 'TLFi',
        author: '',
        work: '',
        certainty: 'probable',
      },
      morphemes: [
        {
          id: 'm_para',
          surface: 'para-',
          kind: 'pfx',
          meaningZh: '抵擋、防護',
          meaningFr: 'parer, protéger',
          origin: 'It',
          originForm: 'parare',
          noteZh: '借自義大利語 parare「擋開」，在法語裡專職製造防護合劑。',
        },
        {
          id: 'm_pluie',
          surface: 'pluie',
          kind: 'root',
          meaningZh: '雨',
          meaningFr: 'pluie',
          origin: 'Lat',
          originForm: 'pluvia',
          noteZh: '拉丁 pluvia → 古法語 pluie。',
        },
      ],
      path: [
        {
          era: 'Lat',
          lang: 'Lat',
          form: 'pluvia',
          glossZh: '雨',
          via: 'inherit',
          noteZh: '拉丁 pluvia「雨」，通俗詞 pluie 的源頭。',
          certainty: 'certain',
        },
        {
          era: 'OF',
          lang: 'OF',
          form: 'pluie',
          glossZh: '雨',
          via: 'popular',
          noteZh: '通俗音變：pluvia → pluie。',
          certainty: 'certain',
        },
        {
          era: 'It',
          lang: 'It',
          form: 'parare',
          glossZh: '擋開',
          via: 'borrow',
          noteZh: '義大利語 parare「擋開」，法語借來專職製造防護合劑（para-）。',
          certainty: 'certain',
        },
        {
          era: 'Fr',
          lang: 'Fr',
          form: 'parapluie',
          glossZh: '雨傘（17 世紀合劑）',
          via: 'compound',
          noteZh: '17 世紀合劑：para-（擋）+ pluie（雨）。',
          certainty: 'certain',
        },
      ],
      example: { fr: 'N’oublie pas ton parapluie.', zh: '別忘了你的傘。' },
    },
    souvenir: {
      demo: true,
      word: 'souvenir',
      lemma: 'souvenir',
      ipa: '/su.və.niʁ/',
      pos: 'n',
      gender: 'm',
      glossZh: '回憶；紀念品',
      glossFr: 'mémoire d’un moment ; objet qui la rappelle',
      alchNoteZh: '「從下方／從身後而來」——往事自己走回眼前。動詞與名詞是同一爐的兩種結晶。',
      firstAttested: {
        year: '1775',
        era: 'Fr',
        form: 'souvenir',
        whereZh: '法國書面語（作名詞）；動詞 sovenir 已見於 12 世紀',
        sourceZh: 'TLFi',
        author: '',
        work: '',
        certainty: 'probable',
      },
      morphemes: [
        {
          id: 'm_sou',
          surface: 'sou-',
          kind: 'pfx',
          meaningZh: '在下、從後',
          meaningFr: 'sous, de dessous',
          origin: 'Lat',
          originForm: 'sub-',
          originPath: 'Lat sub- → OF sou- → Fr sou-',
          noteZh: 'sub- 在法語裡常弱化成 sou- / souv-。',
        },
        {
          id: 'm_ven',
          surface: 'ven',
          kind: 'root',
          meaningZh: '來',
          meaningFr: 'venir',
          origin: 'Lat',
          originForm: 'venire',
          originPath: 'PIE *gʷem- → Lat venire → OF venir',
          noteZh: '拉丁 venire「來」。souvenir = 來到心上。',
        },
        {
          id: 'm_ir',
          surface: '-ir',
          kind: 'infl',
          meaningZh: '不定詞詞尾',
          meaningFr: 'infinitif',
          origin: 'Fr',
          originForm: '-ir',
          noteZh: '第二組動詞不定詞。作名詞時這層已經凝固。',
        },
      ],
      path: [
        {
          era: 'PIE',
          lang: 'PIE',
          form: '*gʷem-',
          glossZh: '走、來（存疑構擬）',
          via: 'reconstruct',
          noteZh: '通行構擬：來到、走向。souvenir 的「來」在此層。',
          certainty: 'reconstructed',
        },
        {
          era: 'Lat',
          lang: 'Lat',
          form: 'subvenire',
          glossZh: '前來援助；來到心上',
          via: 'inherit',
          noteZh: 'sub-「從下／從後」+ venire「來」：來到心上，也指前來援助。',
          certainty: 'certain',
        },
        {
          era: 'VL',
          lang: 'VL',
          form: '*subvenire',
          glossZh: '想起',
          via: 'popular',
          noteZh: '通俗拉丁裡語義偏向「來到心上／想起」；sub- 弱化為 sou-。',
          certainty: 'probable',
        },
        {
          era: 'OF',
          lang: 'OF',
          form: 'sovenir',
          glossZh: '想起',
          via: 'popular',
          noteZh: '古法語 sovenir：b 脫落，元音弱化。',
          certainty: 'certain',
        },
        {
          era: 'Fr',
          lang: 'Fr',
          form: 'souvenir',
          glossZh: '回憶；紀念品',
          via: 'inherit',
          noteZh: '動詞與名詞同一爐：往事走回眼前，也凝固成紀念品。',
          certainty: 'certain',
        },
      ],
      example: { fr: 'Garde ce billet en souvenir.', zh: '留著這張票當紀念。' },
    },
    bibliotheque: {
      demo: true,
      word: 'bibliothèque',
      lemma: 'bibliothèque',
      ipa: '/bi.bli.jɔ.tɛk/',
      pos: 'n',
      gender: 'f',
      glossZh: '圖書館；書櫃',
      glossFr: 'lieu ou meuble où l’on range les livres',
      alchNoteZh: '希臘的「書」與「匣」合劑：書的容器，後來變成書的殿堂。',
      firstAttested: {
        year: '1493',
        era: 'Fr',
        form: 'bibliothèque',
        whereZh: '法國書面語',
        sourceZh: 'TLFi',
        author: '',
        work: '',
        certainty: 'probable',
      },
      morphemes: [
        {
          id: 'm_biblio',
          surface: 'biblio-',
          kind: 'cf',
          meaningZh: '書',
          meaningFr: 'livre',
          origin: 'Gk',
          originForm: 'biblíon',
          noteZh: '古希臘 βιβλίον「小書、紙草卷」，本義與 Byblos 港有關。',
        },
        {
          id: 'm_theque',
          surface: '-thèque',
          kind: 'cf',
          meaningZh: '匣、庫',
          meaningFr: 'coffre, dépôt',
          origin: 'Gk',
          originForm: 'thḗkē',
          noteZh: 'θήκη「箱子」。法語裡專職製造「…館／…庫」。',
        },
      ],
      path: [
        {
          era: 'Gk',
          lang: 'Gk',
          form: 'bibliothḗkē',
          glossZh: '書匣',
          via: 'inherit',
          noteZh: 'βιβλίον「小書」+ θήκη「箱子」：書的容器。',
          certainty: 'certain',
        },
        {
          era: 'Lat',
          lang: 'Lat',
          form: 'bibliotheca',
          glossZh: '藏書處',
          via: 'borrow',
          noteZh: '拉丁借希臘詞，義從書匣擴到藏書之處。',
          certainty: 'certain',
        },
        {
          era: 'Fr',
          lang: 'Fr',
          form: 'bibliothèque',
          glossZh: '圖書館；書櫃',
          via: 'learned',
          noteZh: '法語書面借入，thèque 後來專職製造「…館／…庫」。',
          certainty: 'certain',
        },
      ],
      example: { fr: 'Je te retrouve à la bibliothèque.', zh: '我在圖書館等你。' },
    },
    defaire: {
      demo: true,
      word: 'défaire',
      lemma: 'défaire',
      ipa: '/de.fɛʁ/',
      pos: 'v',
      gender: '',
      glossZh: '解開；拆毀；擊敗',
      glossFr: 'défaire ce qui était fait ; vaincre',
      alchNoteZh: '反向的水銀作用在「做」之根上：把已成之事還原。',
      firstAttested: {
        year: '12c',
        era: 'OF',
        form: 'desfaire',
        whereZh: '古法語文獻',
        sourceZh: 'TLFi',
        author: '',
        work: '',
        certainty: 'probable',
      },
      morphemes: [
        {
          id: 'm_de',
          surface: 'dé-',
          kind: 'pfx',
          meaningZh: '反向、分離',
          meaningFr: 'inversion, séparation',
          origin: 'Lat',
          originForm: 'dis-',
          noteZh: '拉丁 dis- 在法語常作 dé-。',
        },
        {
          id: 'm_faire',
          surface: 'faire',
          kind: 'root',
          meaningZh: '做、使成為',
          meaningFr: 'faire',
          origin: 'Lat',
          originForm: 'facere',
          noteZh: '第三組不規則動詞。書面詞見 fabrication、facteur。',
        },
      ],
      path: [
        {
          era: 'PIE',
          lang: 'PIE',
          form: '*dʰeh₁-',
          glossZh: '放置、做（存疑構擬）',
          via: 'reconstruct',
          noteZh: '通行構擬：放置、使成為。拉丁 facere 在此層。',
          certainty: 'reconstructed',
        },
        {
          era: 'Lat',
          lang: 'Lat',
          form: 'facere',
          glossZh: '做',
          via: 'inherit',
          noteZh: '拉丁 facere。書面雙重詞見 fabrication、facteur。',
          certainty: 'certain',
        },
        {
          era: 'VL',
          lang: 'VL',
          form: '*fare',
          glossZh: '做',
          via: 'popular',
          noteZh: '通俗拉丁弱化為 *fare 一類短形，後世 faire。',
          certainty: 'probable',
        },
        {
          era: 'OF',
          lang: 'OF',
          form: 'desfaire',
          glossZh: '解開、拆毀',
          via: 'popular',
          noteZh: 'dis- → des-/dé- 覆上 faire：把已成之事還原。',
          certainty: 'certain',
        },
        {
          era: 'Fr',
          lang: 'Fr',
          form: 'défaire',
          glossZh: '解開；擊敗',
          via: 'inherit',
          noteZh: '現代法語定形；亦可指擊敗（把對方「拆掉」）。',
          certainty: 'certain',
        },
      ],
      example: { fr: 'Défais tes chaussures.', zh: '把鞋子解開。' },
    },
  };

  ANALYSES["aujourd'hui"] = {
    demo: true,
    word: "aujourd'hui",
    lemma: "aujourd'hui",
    ipa: '/o.ʒuʁ.dɥi/',
    pos: 'adv',
    gender: '',
    glossZh: '今天',
    glossFr: 'le jour présent',
    alchNoteZh: '「在今天的這一日」——把「日」說了兩次，凝固成一個副詞。',
    firstAttested: {
      year: '12c',
      era: 'OF',
      form: "au jor d'hui",
      whereZh: '古法語文獻',
      sourceZh: 'TLFi',
      author: '',
      work: '',
      certainty: 'probable',
    },
    morphemes: [
      {
        id: 'm_au',
        surface: 'au',
        kind: 'oth',
        meaningZh: '在（à + le）',
        meaningFr: 'à le',
        origin: 'Fr',
        originForm: 'au',
        noteZh: '介詞冠詞縮合。',
      },
      {
        id: 'm_jour',
        surface: 'jour',
        kind: 'root',
        meaningZh: '日、白天',
        meaningFr: 'jour',
        origin: 'Lat',
        originForm: 'diurnum',
        noteZh: '拉丁 diurnum「日間的」。',
      },
      {
        id: 'm_d',
        surface: "d'",
        kind: 'oth',
        meaningZh: '的',
        meaningFr: 'de',
        origin: 'Fr',
        originForm: 'de',
        noteZh: '連接 jour 與 hui。',
      },
      {
        id: 'm_hui',
        surface: 'hui',
        kind: 'root',
        meaningZh: '今日（古）',
        meaningFr: 'hui (vieilli)',
        origin: 'Lat',
        originForm: 'hodie',
        noteZh: 'hodie = hoc die「此日」。hui 單獨已死，只活在這個合劑裡。',
      },
    ],
    path: [
      {
        era: 'Lat',
        lang: 'Lat',
        form: 'hodie',
        glossZh: '今天（此日）',
        via: 'inherit',
        noteZh: 'hodie = hoc die「此日」。hui 的源頭。',
        certainty: 'certain',
      },
      {
        era: 'OF',
        lang: 'OF',
        form: 'hui',
        glossZh: '今天',
        via: 'popular',
        noteZh: '通俗音變 hodie → hui。後來單用已死。',
        certainty: 'certain',
      },
      {
        era: 'MF',
        lang: 'MF',
        form: "au jour d'hui",
        glossZh: '在今天這一日',
        via: 'compound',
        noteZh: '把「日」說了兩次：à le jour de hui，凝固前仍可拆。',
        certainty: 'certain',
      },
      {
        era: 'Fr',
        lang: 'Fr',
        form: "aujourd'hui",
        glossZh: '今天',
        via: 'compound',
        noteZh: '書寫凝固成一個副詞。hui 只活在這個合劑裡。',
        certainty: 'certain',
      },
    ],
    example: { fr: "Aujourd'hui il pleut.", zh: '今天下雨。' },
  };

  ANALYSES.soudain = {
    demo: true,
    word: 'soudain',
    lemma: 'soudain',
    ipa: '/su.dɛ̃/',
    pos: 'adj',
    gender: 'm',
    glossZh: '突然的',
    glossFr: 'qui arrive de manière subite',
    alchNoteZh: '黏著詞根 soud-（猝然，出自 subitus）與後綴 -ain（拉丁 -ānus）合煉，沉澱為不期而至。',
    firstAttested: {
      year: '12c',
      era: 'OF',
      form: 'sodain',
      whereZh: '古法語文獻',
      sourceZh: 'TLFi',
      author: '',
      work: '',
      certainty: 'probable',
    },
    morphemes: [
      {
        id: 'm_soud',
        surface: 'soud',
        kind: 'root',
        meaningZh: '突然、猝然',
        meaningFr: 'subit',
        origin: 'Lat',
        originForm: 'subitus',
        noteZh: '通俗拉丁音變後，詞根不能單用，但仍是有意義的一塊。',
      },
      {
        id: 'm_ain',
        surface: '-ain',
        kind: 'sfx',
        meaningZh: '形容詞詞尾',
        meaningFr: 'suffixe adjectival',
        origin: 'Lat',
        originForm: '-ānus',
        noteZh: '與 certain、humain、lointain 同一枚 -ain。',
      },
    ],
    path: [
      {
        era: 'Lat',
        lang: 'Lat',
        form: 'subitus',
        glossZh: '突然的',
        via: 'inherit',
        noteZh: '拉丁 subitus「突然的」。書面雙重詞 subit 由此。',
        certainty: 'certain',
      },
      {
        era: 'Lat',
        lang: 'Lat',
        form: 'subitānus',
        glossZh: '突然發生的',
        via: 'inherit',
        noteZh: '加 -ānus 煉成形容詞；法語 -ain 的源頭。',
        certainty: 'certain',
      },
      {
        era: 'VL',
        lang: 'VL',
        form: '*sotānus',
        glossZh: '突然的（通俗音變，存疑）',
        via: 'popular',
        noteZh: '通俗音變：b 脫落、元音變化。構擬形，certainty 為 probable。',
        certainty: 'probable',
      },
      {
        era: 'OF',
        lang: 'OF',
        form: 'sodain',
        glossZh: '突然的',
        via: 'popular',
        noteZh: '古法語可見 sodain / soudain 一類拼寫。',
        certainty: 'certain',
      },
      {
        era: 'Fr',
        lang: 'Fr',
        form: 'soudain',
        glossZh: '突然的',
        via: 'inherit',
        noteZh: '現代定形。詞根 soud- 不能單用，仍與 -ain 可切。',
        certainty: 'certain',
      },
    ],
    example: { fr: 'Un bruit soudain.', zh: '一聲突如其來的響動。' },
  };

  const EXPANDS = {
    'incroyable|croy|distill': {
      op: 'distill',
      seed: 'croy',
      items: [
        { word: 'croire', kind: 'base', pos: 'v', glossZh: '相信', linkZh: '現代通俗動詞；語幹 croy- 由此切出', era: 'Fr' },
        { word: 'croire', kind: 'root', pos: 'v', glossZh: '相信', linkZh: '中古／古法語定形；c- 腭化、d 脫落', era: 'OF' },
        { word: '*credere', kind: 'root', pos: 'v', glossZh: '相信', linkZh: '通俗拉丁：同一動詞，為腭化做準備', era: 'VL' },
        { word: 'credere', kind: 'root', pos: 'v', glossZh: '相信、託付', linkZh: '拉丁原質：把信任放下', era: 'Lat' },
        { word: '*ḱred-dʰeh₁-', kind: 'root', pos: '', glossZh: '把心放下、託付（存疑）', linkZh: 'PIE 通行構擬（LIV），不是少數異說', era: 'PIE' },
      ],
    },
    'incroyable|croy|derive': {
      op: 'derive',
      seed: 'croy',
      items: [
        { word: 'croire', kind: 'base', pos: 'v', glossZh: '相信', linkZh: '通俗動詞原形', era: 'Fr' },
        { word: 'croyance', kind: 'derived', pos: 'n', glossZh: '信念、信仰', linkZh: '通俗名詞', era: 'Fr' },
        { word: 'croyant', kind: 'derived', pos: 'n', glossZh: '信徒', linkZh: '現在分詞凝固', era: 'Fr' },
        { word: 'crédible', kind: 'learned', pos: 'adj', glossZh: '可信的', linkZh: '書面拉丁雙重詞', era: 'Fr' },
        { word: 'crédit', kind: 'learned', pos: 'n', glossZh: '信用；學分', linkZh: '書面詞 crédit < creditum', era: 'Fr' },
        { word: 'créance', kind: 'derived', pos: 'n', glossZh: '債權；信念（古）', linkZh: '較文的通俗名詞', era: 'Fr' },
        { word: 'mécréant', kind: 'derived', pos: 'n', glossZh: '異教徒；惡棍', linkZh: 'mé- + croyant', era: 'Fr' },
      ],
    },
    'incroyable|in-|derive': {
      op: 'derive',
      seed: 'in-',
      items: [
        { word: 'invisible', kind: 'derived', pos: 'adj', glossZh: '看不見的', linkZh: '同一否定前綴', era: 'Fr' },
        { word: 'inactif', kind: 'derived', pos: 'adj', glossZh: '不活動的', linkZh: 'in- + actif', era: 'Fr' },
        { word: 'injuste', kind: 'derived', pos: 'adj', glossZh: '不公正的', linkZh: 'in- + juste', era: 'Fr' },
        { word: 'incapable', kind: 'derived', pos: 'adj', glossZh: '無能的', linkZh: 'in- + capable', era: 'Fr' },
        { word: 'inconnu', kind: 'derived', pos: 'adj', glossZh: '未知的', linkZh: 'in- + connu', era: 'Fr' },
      ],
    },
    'incroyable|-able|derive': {
      op: 'derive',
      seed: '-able',
      items: [
        { word: 'aimable', kind: 'derived', pos: 'adj', glossZh: '和藹可親的', linkZh: 'aimer + -able', era: 'Fr' },
        { word: 'portable', kind: 'derived', pos: 'adj', glossZh: '可攜的', linkZh: 'porter + -able', era: 'Fr' },
        { word: 'lisible', kind: 'derived', pos: 'adj', glossZh: '可讀的', linkZh: '異形 -ible', era: 'Fr' },
        { word: 'durable', kind: 'derived', pos: 'adj', glossZh: '耐久的', linkZh: 'durer + -able', era: 'Fr' },
        { word: 'capable', kind: 'derived', pos: 'adj', glossZh: '有能力的', linkZh: '書面詞', era: 'Fr' },
      ],
    },
    'soudain|soud|derive': {
      op: 'derive',
      seed: 'soud',
      items: [
        { word: 'soudain', kind: 'derived', pos: 'adj', glossZh: '突然的', linkZh: '本詞', era: 'Fr' },
        { word: 'soudainement', kind: 'derived', pos: 'adv', glossZh: '突然地', linkZh: 'soudain + -ment', era: 'Fr' },
        { word: 'subit', kind: 'learned', pos: 'adj', glossZh: '猝然的', linkZh: '書面拉丁雙重詞', era: 'Fr' },
        { word: 'subitement', kind: 'learned', pos: 'adv', glossZh: '猝然地', linkZh: 'subit + -ment', era: 'Fr' },
      ],
    },
    'soudain|-ain|derive': {
      op: 'derive',
      seed: '-ain',
      items: [
        { word: 'certain', kind: 'derived', pos: 'adj', glossZh: '確定的', linkZh: '同一 -ain', era: 'Fr' },
        { word: 'humain', kind: 'derived', pos: 'adj', glossZh: '人的', linkZh: 'hum- + -ain', era: 'Fr' },
        { word: 'lointain', kind: 'derived', pos: 'adj', glossZh: '遙遠的', linkZh: 'loin + -ain', era: 'Fr' },
        { word: 'hautain', kind: 'derived', pos: 'adj', glossZh: '高傲的', linkZh: 'haut + -ain', era: 'Fr' },
        { word: 'souverain', kind: 'derived', pos: 'adj', glossZh: '至高的', linkZh: '同一後綴', era: 'Fr' },
      ],
    },
    'parapluie|para-|compound': {
      op: 'compound',
      seed: 'para-',
      items: [
        { word: 'paratonnerre', kind: 'compound', pos: 'n', glossZh: '避雷針', linkZh: '擋雷', era: 'Fr' },
        { word: 'parasol', kind: 'compound', pos: 'n', glossZh: '遮陽傘', linkZh: '擋太陽', era: 'Fr' },
        { word: 'paravent', kind: 'compound', pos: 'n', glossZh: '屏風', linkZh: '擋風', era: 'Fr' },
        { word: 'parachute', kind: 'compound', pos: 'n', glossZh: '降落傘', linkZh: '擋墜落', era: 'Fr' },
        { word: 'parabrise', kind: 'compound', pos: 'n', glossZh: '擋風玻璃', linkZh: '擋風（汽車）', era: 'Fr' },
      ],
    },
    'parapluie|para-|derive': {
      op: 'derive',
      seed: 'para-',
      items: [
        { word: 'parer', kind: 'base', pos: 'v', glossZh: '擋開；打扮', linkZh: '義大利 parare 的法語動詞', era: 'Fr' },
        { word: 'parade', kind: 'derived', pos: 'n', glossZh: '遊行；招架', linkZh: '同源書面／軍事義', era: 'Fr' },
      ],
    },
    'parapluie|pluie|derive': {
      op: 'derive',
      seed: 'pluie',
      items: [
        { word: 'pleuvoir', kind: 'base', pos: 'v', glossZh: '下雨', linkZh: '同一雨根的動詞', era: 'Fr' },
        { word: 'pluvieux', kind: 'derived', pos: 'adj', glossZh: '多雨的', linkZh: '書面形容詞', era: 'Fr' },
        { word: 'pluvial', kind: 'learned', pos: 'adj', glossZh: '雨水的', linkZh: '拉丁 pluvialis', era: 'Fr' },
        { word: 'pluviomètre', kind: 'compound', pos: 'n', glossZh: '雨量計', linkZh: '雨 + 計量', era: 'Fr' },
      ],
    },
    'parapluie|pluie|distill': {
      op: 'distill',
      seed: 'pluie',
      items: [
        { word: 'pluie', kind: 'base', pos: 'n', glossZh: '雨', linkZh: '現代法語', era: 'Fr' },
        { word: 'pluvia', kind: 'root', pos: 'n', glossZh: '雨', linkZh: '拉丁原質', era: 'Lat' },
        { word: 'pluere', kind: 'root', pos: 'v', glossZh: '下雨', linkZh: '拉丁動詞', era: 'Lat' },
      ],
    },
    'souvenir|ven|distill': {
      op: 'distill',
      seed: 'ven',
      items: [
        { word: 'venir', kind: 'base', pos: 'v', glossZh: '來', linkZh: '現代動詞', era: 'Fr' },
        { word: 'venire', kind: 'root', pos: 'v', glossZh: '來', linkZh: '拉丁原質', era: 'Lat' },
        { word: '*gʷem-', kind: 'root', pos: '', glossZh: '走、來（存疑）', linkZh: 'PIE 構擬', era: 'PIE' },
      ],
    },
    'souvenir|ven|derive': {
      op: 'derive',
      seed: 'ven',
      items: [
        { word: 'venir', kind: 'base', pos: 'v', glossZh: '來', linkZh: '詞根動詞', era: 'Fr' },
        { word: 'avenir', kind: 'derived', pos: 'n', glossZh: '未來', linkZh: 'à + venir：將要來到的', era: 'Fr' },
        { word: 'devenir', kind: 'derived', pos: 'v', glossZh: '變成', linkZh: 'de + venir', era: 'Fr' },
        { word: 'prévenir', kind: 'derived', pos: 'v', glossZh: '預先告知；預防', linkZh: 'pré- + venir', era: 'Fr' },
        { word: 'convenir', kind: 'derived', pos: 'v', glossZh: '適合；約定', linkZh: 'con- + venir', era: 'Fr' },
        { word: 'revenir', kind: 'derived', pos: 'v', glossZh: '回來', linkZh: 're- + venir', era: 'Fr' },
        { word: 'revenant', kind: 'derived', pos: 'n', glossZh: '亡魂', linkZh: '回來的人', era: 'Fr' },
      ],
    },
    'souvenir|sou-|distill': {
      op: 'distill',
      seed: 'sou-',
      items: [
        { word: 'sous', kind: 'base', pos: 'prep', glossZh: '在…之下', linkZh: '同一 sub- 的介詞', era: 'Fr' },
        { word: 'sub-', kind: 'root', pos: 'pfx', glossZh: '在下', linkZh: '拉丁前綴', era: 'Lat' },
      ],
    },
    'bibliothèque|biblio-|derive': {
      op: 'derive',
      seed: 'biblio-',
      items: [
        { word: 'bible', kind: 'derived', pos: 'n', glossZh: '聖經；大部頭', linkZh: '同一「書」根', era: 'Fr' },
        { word: 'bibliographie', kind: 'derived', pos: 'n', glossZh: '書目', linkZh: '書 + 寫', era: 'Fr' },
        { word: 'bibliophile', kind: 'derived', pos: 'n', glossZh: '藏書家', linkZh: '書 + 愛', era: 'Fr' },
        { word: 'bibliobus', kind: 'compound', pos: 'n', glossZh: '巡迴圖書館車', linkZh: '書庫 + 公車', era: 'Fr' },
      ],
    },
    'bibliothèque|-thèque|compound': {
      op: 'compound',
      seed: '-thèque',
      items: [
        { word: 'discothèque', kind: 'compound', pos: 'n', glossZh: '夜店；唱片庫', linkZh: '唱片之匣', era: 'Fr' },
        { word: 'phonothèque', kind: 'compound', pos: 'n', glossZh: '錄音資料館', linkZh: '聲音之庫', era: 'Fr' },
        { word: 'cinémathèque', kind: 'compound', pos: 'n', glossZh: '電影資料館', linkZh: '影片之庫', era: 'Fr' },
        { word: 'glyptothèque', kind: 'compound', pos: 'n', glossZh: '雕刻博物館', linkZh: '雕刻之匣', era: 'Fr' },
      ],
    },
    'bibliothèque|biblio-|distill': {
      op: 'distill',
      seed: 'biblio-',
      items: [
        { word: 'biblíon', kind: 'root', pos: 'n', glossZh: '小書、紙草卷', linkZh: '古希臘原質', era: 'Gk' },
        { word: 'bíblos', kind: 'root', pos: 'n', glossZh: '紙草；Byblos', linkZh: '港名與材料（存疑層）', era: 'Gk' },
      ],
    },
    'défaire|faire|distill': {
      op: 'distill',
      seed: 'faire',
      items: [
        { word: 'faire', kind: 'base', pos: 'v', glossZh: '做', linkZh: '現代動詞', era: 'Fr' },
        { word: 'facere', kind: 'root', pos: 'v', glossZh: '做', linkZh: '拉丁原質', era: 'Lat' },
        { word: '*dʰeh₁-', kind: 'root', pos: '', glossZh: '放置、做（存疑）', linkZh: 'PIE 構擬', era: 'PIE' },
      ],
    },
    'défaire|faire|derive': {
      op: 'derive',
      seed: 'faire',
      items: [
        { word: 'affaire', kind: 'derived', pos: 'n', glossZh: '事情；事務', linkZh: 'à + faire 凝固', era: 'Fr' },
        { word: 'forfait', kind: 'derived', pos: 'n', glossZh: '套餐；重罪', linkZh: 'for- + fait', era: 'Fr' },
        { word: 'contrefaire', kind: 'derived', pos: 'v', glossZh: '仿造', linkZh: 'contre + faire', era: 'Fr' },
        { word: 'satisfaire', kind: 'derived', pos: 'v', glossZh: '使滿足', linkZh: '書面 satis + facere', era: 'Fr' },
        { word: 'fabrication', kind: 'learned', pos: 'n', glossZh: '製造', linkZh: '書面拉丁詞', era: 'Fr' },
        { word: 'facteur', kind: 'learned', pos: 'n', glossZh: '因素；郵差', linkZh: '做者', era: 'Fr' },
      ],
    },
    'défaire|dé-|derive': {
      op: 'derive',
      seed: 'dé-',
      items: [
        { word: 'défaire', kind: 'derived', pos: 'v', glossZh: '解開', linkZh: '本詞', era: 'Fr' },
        { word: 'détacher', kind: 'derived', pos: 'v', glossZh: '解開、分離', linkZh: '同一反向前綴', era: 'Fr' },
        { word: 'déconstruire', kind: 'derived', pos: 'v', glossZh: '解構', linkZh: 'dé- + construire', era: 'Fr' },
        { word: 'décoller', kind: 'derived', pos: 'v', glossZh: '揭下；起飛', linkZh: 'dé- + coller', era: 'Fr' },
      ],
    },
    "aujourd'hui|hui|distill": {
      op: 'distill',
      seed: 'hui',
      items: [
        { word: 'hui', kind: 'base', pos: 'adv', glossZh: '今日（古，已死）', linkZh: '只殘存在合劑裡', era: 'OF' },
        { word: 'hodie', kind: 'root', pos: 'adv', glossZh: '今天', linkZh: 'hoc die 此日', era: 'Lat' },
      ],
    },
    "aujourd'hui|jour|derive": {
      op: 'derive',
      seed: 'jour',
      items: [
        { word: 'journée', kind: 'derived', pos: 'n', glossZh: '一整天', linkZh: '日的時段', era: 'Fr' },
        { word: 'journal', kind: 'derived', pos: 'n', glossZh: '報紙；日記', linkZh: '每日的', era: 'Fr' },
        { word: 'ajourner', kind: 'derived', pos: 'v', glossZh: '延期', linkZh: '放到另一日', era: 'Fr' },
        { word: 'toujours', kind: 'compound', pos: 'adv', glossZh: '總是', linkZh: 'tous + jours', era: 'Fr' },
        { word: 'bonjour', kind: 'compound', pos: 'n', glossZh: '日安', linkZh: 'bon + jour', era: 'Fr' },
      ],
    },
    "aujourd'hui|jour|compound": {
      op: 'compound',
      seed: 'jour',
      items: [
        { word: 'bonjour', kind: 'compound', pos: 'n', glossZh: '日安', linkZh: '好 + 日', era: 'Fr' },
        { word: 'toujours', kind: 'compound', pos: 'adv', glossZh: '總是', linkZh: '所有的日子', era: 'Fr' },
        { word: 'journellement', kind: 'derived', pos: 'adv', glossZh: '每日地', linkZh: '每日', era: 'Fr' },
      ],
    },
  };

  const COMBINES = {
    'para|pluie': {
      items: [
        { word: 'parapluie', kind: 'compound', pos: 'n', glossZh: '雨傘', linkZh: 'para- + pluie', era: 'Fr' },
      ],
    },
    'biblio|thèque': {
      items: [
        { word: 'bibliothèque', kind: 'compound', pos: 'n', glossZh: '圖書館', linkZh: 'biblio- + -thèque', era: 'Fr' },
      ],
    },
    'jour|hui': {
      items: [
        { word: "aujourd'hui", kind: 'compound', pos: 'adv', glossZh: '今天', linkZh: 'au + jour + d’ + hui', era: 'Fr' },
      ],
    },
    'jour|bon': {
      items: [
        { word: 'bonjour', kind: 'compound', pos: 'n', glossZh: '日安', linkZh: 'bon + jour', era: 'Fr' },
      ],
    },
  };

  const PACKS = {
    fr: { ANALYSES, EXPANDS, COMBINES, EXAMPLES: [
      { word: 'incroyable', gloss: '難以置信' },
      { word: 'parapluie', gloss: '雨傘' },
      { word: 'souvenir', gloss: '回憶' },
      { word: 'bibliothèque', gloss: '圖書館' },
      { word: 'défaire', gloss: '解開' },
      { word: "aujourd'hui", gloss: '今天' },
    ] },
  };

  function register(id, data) {
    PACKS[id] = data;
  }

  function pack(lang) {
    const id = lang || VA.langs?.currentId?.() || 'fr';
    return PACKS[id] || PACKS.fr;
  }

  function lookupAnalysis(normalized, lang) {
    const { ANALYSES: A } = pack(lang);
    const key = String(normalized || '');
    if (A[key]) return A[key];
    const folded = key.replace(/è/g, 'e').replace(/é/g, 'e').replace(/ê/g, 'e').replace(/à/g, 'a');
    if (A[folded]) return A[folded];
    if (folded === 'bibliotheque') return A.bibliotheque || null;
    if (folded === 'defaire') return A.defaire || null;
    const want = VA.schema?.bareForm?.(key);
    if (want) {
      for (const a of Object.values(A)) {
        for (const m of a.morphemes || []) {
          if (VA.schema.bareForm(m.surface) === want) {
            return VA.schema.analysisFromMorpheme(m, a);
          }
        }
      }
    }
    return null;
  }

  function expandKey(word, surface, op) {
    return `${word}|${surface}|${op}`;
  }

  function lookupExpand(word, morph, op, lang) {
    const { EXPANDS: E } = pack(lang);
    const lemma = word;
    const surface = morph?.surface || '';
    const wantOp = VA.schema.normalizeOp(op);
    const direct = E[expandKey(lemma, surface, wantOp)];
    if (direct?.items?.length) return direct;
    const want = VA.schema.bareForm(surface);
    for (const [k, v] of Object.entries(E)) {
      const parts = k.split('|');
      if (parts.length < 3) continue;
      const kOp = VA.schema.normalizeOp(parts[parts.length - 1]);
      const surf = parts.slice(1, -1).join('|');
      if (kOp !== wantOp) continue;
      if (surf === surface || VA.schema.bareForm(surf) === want) {
        if (v?.items?.length) return v;
      }
    }
    return { op: wantOp, seed: surface, items: [] };
  }

  function lookupConiunctio(formA, formB, lang) {
    const a = VA.schema.bareForm(formA);
    const b = VA.schema.bareForm(formB);
    const seed = `${String(formA || '').trim()} + ${String(formB || '').trim()}`;
    const empty = { op: 'compound', seed, items: [] };
    if (!a || !b || a === b) return empty;

    const { ANALYSES: A = {}, EXPANDS: E = {}, COMBINES: C = {} } = pack(lang);
    const seen = new Set();
    const items = [];
    const add = (it) => {
      const word = String(it?.word || '').trim();
      if (!word) return;
      const key = VA.schema.bareForm(word);
      if (!key || seen.has(key)) return;
      seen.add(key);
      items.push({
        word,
        kind: it.kind || 'compound',
        pos: it.pos || 'n',
        glossZh: it.glossZh || '',
        linkZh: it.linkZh || seed,
        era: it.era || '',
      });
    };

    const named = C[`${a}|${b}`] || C[`${b}|${a}`];
    (named?.items || []).forEach(add);

    for (const analysis of Object.values(A)) {
      const morphs = analysis.morphemes || [];
      if (morphs.length !== 2) continue;
      const surfaces = morphs.map((m) => VA.schema.bareForm(m.surface));
      if (surfaces.includes(a) && surfaces.includes(b)) {
        add({
          word: analysis.lemma || analysis.word,
          kind: 'compound',
          pos: analysis.pos,
          glossZh: analysis.glossZh,
          linkZh: seed,
          era: analysis.path?.[analysis.path.length - 1]?.era || '',
        });
      }
    }

    for (const v of Object.values(E)) {
      for (const it of v?.items || []) {
        const blob = VA.schema.bareForm(`${it.word} ${it.linkZh || ''}`);
        if (blob.includes(a) && blob.includes(b)) add(it);
      }
    }

    return { op: 'compound', seed, items: items.slice(0, 8) };
  }

  VA.demo = {
    get ANALYSES() {
      return pack().ANALYSES;
    },
    get EXPANDS() {
      return pack().EXPANDS;
    },
    get COMBINES() {
      return pack().COMBINES || {};
    },
    get EXAMPLES() {
      return pack().EXAMPLES;
    },
    register,
    lookupAnalysis,
    lookupExpand,
    lookupConiunctio,
  };
})(typeof window !== 'undefined' ? window : globalThis);

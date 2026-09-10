/**
 * zh-TW i18n (file:// safe). V1 UI is Traditional Chinese only.
 */
(function (global) {
  const VO = (global.VerbaOrbis = global.VerbaOrbis || {});

  const STRINGS = {
    'zh-TW': {
      'app.title': 'Verba Orbis',
      'app.subtitle': '詞的世界',
      'hero.title': '同一個意思，九種語言怎麼切',
      'hero.desc': '右側寫下詞語。先鎖一個義項，再看漢字圈與歐語怎麼切。',
      'search.placeholder': '寫下詞語或概念…',
      'search.compare': '比較',
      'nav.settings': '設定',
      'history.title': '查詢紀錄',
      'history.toc': '查詢紀錄',
      'history.clear': '清空',
      'history.filter': '篩選紀錄…',
      'history.empty': '尚無查詢紀錄',
      'history.delete': '刪除',
      'history.deleteConfirm': '刪除「{q}」這筆紀錄？',
      'settings.title': '設定',
      'settings.ai': 'AI（自備金鑰）',
      'settings.apiKey': 'API Key',
      'settings.apiKeyHint': '僅存在本機瀏覽器，不會上傳。',
      'settings.copyRadixKey': '從 Radix Multi 複製金鑰',
      'settings.baseUrl': 'Base URL',
      'settings.model': 'Model',
      'settings.reasoning': '推理強度',
      'settings.reasoningHint': 'Grok 4.6 預設高推理；本站預設低，以免筆記又慢又貴。',
      'settings.radixUrl': 'Radix Multi 網址（可選）',
      'settings.radixUrlHint': '填了之後，歐語／韓日卡片可跳去拆形態。第一版不改 Radix。',
      'settings.data': '資料',
      'settings.historyWarn': '紀錄只存在本機，用久了可能變大。可匯出後再清空。',
      'settings.includeKey': '匯出時包含 API Key（預設關）',
      'settings.export': '匯出 JSON',
      'settings.import': '匯入 JSON',
      'settings.save': '儲存設定',
      'status.needKey': '請先在設定中填入 API Key',
      'status.empty': '請輸入詞語或概念',
      'status.overlong': '請改成詞或短語（64 字 / 12 詞以內）',
      'status.longHint': '查詢偏長 · 仍會嘗試',
      'status.listing': '正在列出可能的意思…',
      'status.writingA': '正在寫漢字圈（中·韓·日）…',
      'status.writingB': '漢字圈已完成 · 正在寫歐語（含拉丁）…',
      'status.saved': '已儲存為筆記',
      'status.cached': '已從紀錄載入',
      'status.emptySenses': '模型沒有列出義項 · 請重試',
      'status.timeout': '請求逾時 · 請重試',
      'status.parseFail': '模型回傳無法解析。可按「重試歐語圈」或「重新比較」。',
      'status.zoneBFail': '歐語圈失敗 · 重試',
      'status.exportOk': '已匯出',
      'status.importOk': '匯入完成',
      'status.copiedKey': '已複製 Radix Multi 金鑰',
      'status.noRadixKey': 'Radix Multi 沒有儲存的金鑰',
      'status.quota': '本機空間不足 · 請匯出後清空部分紀錄',
      'status.deleted': '已刪除這筆紀錄',
      'status.langHint': '來源語可能不對 · 請點語別',
      'status.settingsSaved': '設定已儲存',
      'status.wrongImport': '這是其他產品的備份，無法匯入',
      'status.speakLoading': '產生語音中…',
      'status.speakFail': '朗讀失敗',
      'status.speakNeedKey': '朗讀需要 API Key，請先在設定中填入',
      'settings.ttsVoice': '朗讀聲線（xAI TTS）',
      'settings.ttsVoiceHint': '點「朗讀」時產生語音；同字會快取。',
      'picker.title': '先選定一個意思',
      'picker.confirm': '確認此義 · 比較八語',
      'picker.confirmOne': '這就是我要的意思 · 開始比較',
      'picker.retry': '重試',
      'lock.change': '更換義項',
      'lock.recompare': '重新比較',
      'lock.locked': '已鎖定',
      'zone.a': '漢字圈',
      'zone.b': '歐語 · 拉丁為軸',
      'zone.cognates': '日耳曼 / 羅曼 同源網',
      'zone.retryB': '重試歐語圈',
      'card.core': '核心義',
      'card.etym': '語源',
      'card.caveat': '注意',
      'card.drift': '此卡可能漂離鎖定義 · 可重新比較',
      'card.radix': '在 Radix Multi 拆解',
      'card.aiBadge': 'AI 產生 · 僅供參考',
      'card.speak': '朗讀',
      'card.axis': '軸',
      'card.noHeadword': '（無對應詞）',
      'card.flipHint': '點擊看細節',
      'card.flipBack': '點擊翻回',
      'crop.title': '裁切背景',
      'crop.hint': '拖曳選框移動，角落拖曳縮放。比例已對齊這張卡。',
      'crop.apply': '套用此裁切',
      'crop.cancel': '取消',
      'crop.clear': '恢復預設',
      'crop.drop': '放開以更換背景',
      'crop.badFile': '請拖入圖片檔（PNG / JPG / WebP）',
      'crop.saved': '已套用卡片背景',
      'crop.cleared': '已恢復預設背景',
      'zone.expandEssay': '展開說明',
      'equiv.exact': '近乎對等',
      'equiv.narrower': '較窄',
      'equiv.wider': '較寬',
      'equiv.split': '需拆成多詞',
      'equiv.approx': '近似',
      'equiv.gap': '無對等',
      'lang.auto': '自動',
      'lang.zh': '中',
      'lang.ko': '韓',
      'lang.ja': '日',
      'lang.en': '英',
      'lang.de': '德',
      'lang.es': '西',
      'lang.fr': '法',
      'lang.it': '義',
      'lang.la': '拉',
      'langFull.zh': '中文',
      'langFull.ko': '韓語',
      'langFull.ja': '日語',
      'langFull.en': '英語',
      'langFull.de': '德語',
      'langFull.es': '西班牙語',
      'langFull.fr': '法語',
      'langFull.it': '義大利語',
      'langFull.la': '拉丁語',
    },
  };

  let locale = 'zh-TW';

  function t(key) {
    return (STRINGS[locale] && STRINGS[locale][key]) || STRINGS['zh-TW'][key] || key;
  }

  function getLocale() {
    return locale;
  }

  function setLocale(next) {
    locale = next === 'en' ? 'zh-TW' : 'zh-TW';
  }

  function applyI18n(root) {
    const scope = root || document;
    scope.querySelectorAll('[data-i18n]').forEach((el) => {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    scope.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      el.setAttribute('placeholder', t(el.getAttribute('data-i18n-placeholder')));
    });
    scope.querySelectorAll('[data-i18n-title]').forEach((el) => {
      el.setAttribute('title', t(el.getAttribute('data-i18n-title')));
    });
  }

  VO.i18n = { t, getLocale, setLocale, applyI18n, STRINGS };
})(typeof window !== 'undefined' ? window : globalThis);

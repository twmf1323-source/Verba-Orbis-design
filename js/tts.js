/**
 * Click-to-speak: pack language voice (EN/FR), optional xAI TTS.
 */
(function (global) {
  const VA = (global.VerbaAthanor = global.VerbaAthanor || {});

  const MAX_CACHE = 40;
  const cache = new Map();
  let currentAudio = null;
  let currentUtter = null;
  let speakingText = '';
  let onEndCb = null;
  let voicesReady = null;

  const FR_VOICE = /hortense|julie|denise|henri|pauline|claude|français|francais|french|france/i;
  const EN_VOICE = /zira|david|mark|hazel|george|aria|jenny|guy|sonia|ryan|libby|susan|linda|james|daniel|ravi|google us|google uk|english/i;
  const JA_VOICE = /haruka|ayumi|ichiro|nanami|kyoko|sayaka|google 日本語|japanese|日本/i;
  const KO_VOICE = /heami|sunhi|injoon|minho|sunhi|google 한국어|korean|한국/i;

  function cleanText(text) {
    return String(text || '')
      .replace(/^\*+/, '')
      .replace(/^-+|-+$/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function packTts() {
    const p = VA.langs?.current?.();
    if (p?.id === 'en') return p.ttsLang || 'en-US';
    if (p?.id === 'ja') return p.ttsLang || 'ja-JP';
    if (p?.id === 'ko') return p.ttsLang || 'ko-KR';
    if (p?.id === 'fr') return p.ttsLang || 'fr-FR';
    return p?.ttsLang || 'fr-FR';
  }

  function langFor(text, meta) {
    const form = String(text || '');
    const era = String(meta?.era || meta?.origin || meta?.lang || '').toLowerCase();
    if (/^\*/.test(form) || era === 'pie') return '';
    if (meta?.historical) {
      if (/gk|gr|greek/.test(era)) return 'el-GR';
      if (/lat|latin|vl/.test(era)) return 'it-IT';
      if (/de|ger|ohg|mhg|nhg/.test(era)) return 'de-DE';
      if (/^of$|ofr|^mf$|^fr$|fre|fran/.test(era)) return 'fr-FR';
      if (/^oe$|^me$|emode|^mode$|^en$|eng/.test(era)) return 'en-US';
      if (/oj|midj|modj|^ja$|jp|jpn/.test(era)) return 'ja-JP';
      if (/^ok$|^sk$|^mk$|^ko$|kor|hang/.test(era)) return 'ko-KR';
    }
    return packTts();
  }

  function tag(s) {
    return String(s || '').toLowerCase().replace('_', '-');
  }

  function prefix(s) {
    return tag(s).slice(0, 2);
  }

  function pickVoice(lang) {
    const voices = global.speechSynthesis ? speechSynthesis.getVoices() : [];
    if (!voices.length) return null;
    const want = tag(lang || packTts());
    const pre = want.slice(0, 2);
    const pool = voices.filter((v) => prefix(v.lang) === pre);
    const ranked = (pool.length ? pool : voices)
      .map((v) => {
        const l = tag(v.lang);
        let s = 0;
        if (l === want) s = 5;
        else if (l.startsWith(pre)) s = 3;
        if (pre === 'en' && EN_VOICE.test(v.name)) s += 1.4;
        if (pre === 'en' && /en-us|en_us/.test(l)) s += 0.5;
        if (pre === 'ja' && JA_VOICE.test(v.name)) s += 1.4;
        if (pre === 'ko' && KO_VOICE.test(v.name)) s += 1.4;
        if (pre === 'fr' && FR_VOICE.test(v.name)) s += 1.2;
        if (pre === 'en' && FR_VOICE.test(v.name)) s -= 8;
        if (pre === 'ja' && FR_VOICE.test(v.name)) s -= 8;
        if (pre === 'ko' && FR_VOICE.test(v.name)) s -= 8;
        if (pre === 'fr' && EN_VOICE.test(v.name) && !/^fr/.test(l)) s -= 4;
        if (/google|neural|natural|enhanced/i.test(v.name)) s += 0.4;
        if (v.localService) s += 0.15;
        return { v, s };
      })
      .filter((x) =>
        pre === 'en' || pre === 'fr' || pre === 'ja' || pre === 'ko' ? prefix(x.v.lang) === pre : x.s >= 2
      )
      .sort((a, b) => b.s - a.s);
    return ranked[0]?.v || null;
  }

  function readyVoices() {
    if (!global.speechSynthesis) return Promise.resolve([]);
    const have = speechSynthesis.getVoices();
    if (have.length) return Promise.resolve(have);
    if (voicesReady) return voicesReady;
    voicesReady = new Promise((resolve) => {
      const done = () => resolve(speechSynthesis.getVoices() || []);
      speechSynthesis.addEventListener('voiceschanged', done, { once: true });
      setTimeout(done, 600);
    });
    return voicesReady;
  }

  function warmVoices() {
    if (!global.speechSynthesis) return;
    speechSynthesis.getVoices();
    speechSynthesis.addEventListener('voiceschanged', () => speechSynthesis.getVoices());
  }

  function stop() {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }
    if (global.speechSynthesis) speechSynthesis.cancel();
    currentUtter = null;
    speakingText = '';
    const cb = onEndCb;
    onEndCb = null;
    if (cb) cb();
  }

  function cacheKey(text, engine, lang) {
    return `${engine}|${lang}|${text.toLowerCase()}`;
  }

  function grokBase(baseUrl) {
    let base = String(baseUrl || 'https://api.x.ai/v1').trim().replace(/\/+$/, '');
    if (/^https?:\/\/api\.x\.ai$/i.test(base)) base = 'https://api.x.ai/v1';
    return base.replace(/\/v1\/v1$/i, '/v1');
  }

  async function grokUrl(text, { apiKey, baseUrl, lang }) {
    const key = cacheKey(text, 'grok', lang);
    if (cache.has(key)) return cache.get(key);
    const language =
      prefix(lang) === 'fr'
        ? 'fr'
        : prefix(lang) === 'en'
          ? 'en'
          : prefix(lang) === 'ja'
            ? 'ja'
            : prefix(lang) === 'ko'
              ? 'ko'
              : tag(lang).slice(0, 2);
    const res = await fetch(`${grokBase(baseUrl)}/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        text,
        voice_id: 'helios',
        language,
        output_format: { codec: 'mp3', sample_rate: 24000, bit_rate: 128000 },
      }),
    });
    if (!res.ok) throw new Error('GROK_TTS_FAIL');
    const buf = await res.arrayBuffer();
    if (!buf || buf.byteLength < 32) throw new Error('GROK_TTS_EMPTY');
    const url = URL.createObjectURL(new Blob([buf], { type: 'audio/mpeg' }));
    cache.set(key, url);
    while (cache.size > MAX_CACHE) {
      const first = cache.keys().next().value;
      const old = cache.get(first);
      if (old) URL.revokeObjectURL(old);
      cache.delete(first);
    }
    return url;
  }

  function playAudio(url) {
    return new Promise((resolve, reject) => {
      const audio = new Audio(url);
      currentAudio = audio;
      audio.addEventListener('ended', () => {
        if (currentAudio === audio) currentAudio = null;
        resolve();
      });
      audio.addEventListener('error', () => {
        if (currentAudio === audio) currentAudio = null;
        reject(new Error('PLAYBACK_FAILED'));
      });
      const p = audio.play();
      if (p && typeof p.then === 'function') p.catch(reject);
    });
  }

  async function speakBrowser(text, lang) {
    if (!global.speechSynthesis) throw new Error('NO_SPEECH');
    await readyVoices();
    const want = lang || packTts();
    const voice = pickVoice(want);
    if (
      (prefix(want) === 'en' || prefix(want) === 'fr' || prefix(want) === 'ja' || prefix(want) === 'ko') &&
      voice &&
      prefix(voice.lang) !== prefix(want)
    ) {
      throw new Error('WRONG_VOICE');
    }
    return new Promise((resolve, reject) => {
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = prefix(want) === 'en' ? 0.95 : 0.92;
      if (voice) {
        utter.voice = voice;
        utter.lang = voice.lang || want;
      } else {
        utter.lang = want;
      }
      currentUtter = utter;
      utter.onend = () => {
        if (currentUtter === utter) currentUtter = null;
        resolve();
      };
      utter.onerror = () => {
        if (currentUtter === utter) currentUtter = null;
        reject(new Error('SPEECH_ERROR'));
      };
      speechSynthesis.cancel();
      setTimeout(() => speechSynthesis.speak(utter), 40);
    });
  }

  async function speak(text, meta, opts) {
    const form = cleanText(text);
    if (!form) return { ok: false, reason: 'empty' };
    if (/^[/[].+[/\]]$/.test(form) || /^\/[^/]+\/$/.test(form)) {
      return { ok: false, reason: 'reconstructed' };
    }
    const lang = langFor(text, meta || {});
    if (!lang) return { ok: false, reason: 'reconstructed' };

    const same = speakingText === form;
    stop();
    if (same) return { ok: true, stopped: true };

    speakingText = form;
    const settings = opts || {};
    const ended = () => {
      if (speakingText === form) speakingText = '';
      settings.onEnd?.();
    };
    onEndCb = ended;
    settings.onStart?.();

    try {
      if (settings.engine === 'grok' && settings.apiKey) {
        try {
          const url = await grokUrl(form, {
            apiKey: settings.apiKey,
            baseUrl: settings.baseUrl,
            lang,
          });
          await playAudio(url);
          ended();
          return { ok: true, engine: 'grok', lang };
        } catch {
          /* fall through to browser */
        }
      }
      await speakBrowser(form, lang);
      ended();
      return { ok: true, engine: 'browser', lang };
    } catch (err) {
      ended();
      return { ok: false, reason: err.message || String(err) };
    }
  }

  warmVoices();

  VA.tts = { speak, stop, langFor, cleanText, warmVoices };
})(typeof window !== 'undefined' ? window : globalThis);

/**
 * xAI / Grok Text-to-Speech (language-aware).
 * On-demand only; memory cache avoids re-billing the same word+voice.
 */
(function (global) {
  const VO = (global.VerbaOrbis = global.VerbaOrbis || {});

  const MAX_CACHE = 50;
  /** @type {Map<string, string>} */
  const cache = new Map();
  /** @type {HTMLAudioElement | null} */
  let currentAudio = null;

  const TTS_LANG = {
    zh: 'zh',
    ko: 'ko',
    ja: 'ja',
    en: 'en',
    de: 'de',
    es: 'es',
    fr: 'fr',
    it: 'it',
  };

  function ttsLang(lang) {
    return TTS_LANG[lang] || 'en';
  }

  function normalizeBaseUrl(baseUrl) {
    let base = String(baseUrl || 'https://api.x.ai/v1').trim().replace(/\/+$/, '');
    if (/^https?:\/\/api\.x\.ai$/i.test(base)) base = 'https://api.x.ai/v1';
    base = base.replace(/\/v1\/v1$/i, '/v1');
    return base;
  }

  function cacheKey(text, voiceId, language) {
    return `${String(text || '')
      .trim()
      .toLowerCase()}|${String(voiceId || 'helios').toLowerCase()}|${String(language || 'en').toLowerCase()}`;
  }

  function putCache(key, url) {
    if (cache.has(key)) {
      const old = cache.get(key);
      if (old && old !== url) URL.revokeObjectURL(old);
      cache.delete(key);
    }
    cache.set(key, url);
    while (cache.size > MAX_CACHE) {
      const first = cache.keys().next().value;
      const u = cache.get(first);
      if (u) URL.revokeObjectURL(u);
      cache.delete(first);
    }
  }

  function parseErrorBody(text, status) {
    const raw = String(text || '').trim();
    if (!raw) return `HTTP ${status}`;
    try {
      const err = JSON.parse(raw);
      if (typeof err.error === 'string') return err.error;
      if (err.error?.message) return err.error.message;
      if (err.message) return err.message;
      return raw.slice(0, 300);
    } catch {
      return raw.slice(0, 300);
    }
  }

  async function synthesizeSpeech({
    text,
    apiKey,
    baseUrl,
    voiceId = 'helios',
    language = 'en',
  }) {
    const word = String(text || '').trim();
    if (!word) throw new Error('EMPTY_TEXT');
    if (!apiKey) throw new Error('NO_API_KEY');

    const key = cacheKey(word, voiceId, language);
    if (cache.has(key)) return cache.get(key);

    const base = normalizeBaseUrl(baseUrl);
    const url = `${base}/tts`;

    let res;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          text: word,
          voice_id: voiceId || 'helios',
          language: language || 'en',
          output_format: {
            codec: 'mp3',
            sample_rate: 24000,
            bit_rate: 128000,
          },
        }),
      });
    } catch (e) {
      const msg = (e && e.message) || String(e);
      if (/Failed to fetch|NetworkError|CORS|Load failed|TypeError/i.test(msg)) {
        throw new Error(
          '無法連線到 TTS（網路 / CORS / Base URL）。請確認 Base URL 為 https://api.x.ai/v1'
        );
      }
      throw e;
    }

    if (!res.ok) {
      const detail = parseErrorBody(await res.text(), res.status);
      if (res.status === 401 || res.status === 403) {
        throw new Error(`API Key 無效或無權限：${detail}`);
      }
      if (res.status === 404) {
        throw new Error(`找不到聲線或端點（檢查 voice_id / Base URL）：${detail}`);
      }
      if (res.status === 429) {
        throw new Error(`速率限制：${detail}`);
      }
      throw new Error(`TTS HTTP ${res.status}：${detail}`);
    }

    const buf = await res.arrayBuffer();
    if (!buf || buf.byteLength < 32) {
      throw new Error('TTS 回傳空白音訊');
    }
    const blob = new Blob([buf], { type: 'audio/mpeg' });
    const objectUrl = URL.createObjectURL(blob);
    putCache(key, objectUrl);
    return objectUrl;
  }

  function playObjectUrl(objectUrl) {
    return new Promise((resolve, reject) => {
      try {
        if (currentAudio) {
          currentAudio.pause();
          currentAudio = null;
        }
        const audio = new Audio(objectUrl);
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
        if (p && typeof p.then === 'function') {
          p.catch(reject);
        }
      } catch (e) {
        reject(e);
      }
    });
  }

  async function speakWord(opts) {
    const language = opts.language || 'en';
    const objectUrl = await synthesizeSpeech({
      ...opts,
      language,
    });
    await playObjectUrl(objectUrl);
    return objectUrl;
  }

  function stop() {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }
  }

  VO.tts = {
    synthesizeSpeech,
    playObjectUrl,
    speakWord,
    stop,
    cacheKey,
    ttsLang,
  };
})(typeof window !== 'undefined' ? window : globalThis);

/**
 * Furnace bed: The Alchemist's Dawn (looped mp3) + procedural SFX.
 */
(function (global) {
  const VA = (global.VerbaAthanor = global.VerbaAthanor || {});

  let ctx = null;
  let master = null;
  let ambGain = null;
  let sfxGain = null;
  let ambStarted = false;
  let bed = null;
  let bedSrc = 'audio/alchemists-dawn.mp3';
  let ambOn = true;
  let sfxOn = true;
  let ambVol = 0.32;
  let sfxVol = 0.55;
  let ducking = false;
  let noiseBuf = null;
  let circleVoice = null;
  let circleStopTimer = null;
  let circleStartedAt = 0;
  const CIRCLE_MIN_MS = 1200;

  function now() {
    return ctx ? ctx.currentTime : 0;
  }

  function unlock() {
    const AC = global.AudioContext || global.webkitAudioContext;
    if (!AC) return null;
    if (!ctx) {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.85;
      master.connect(ctx.destination);
      ambGain = ctx.createGain();
      sfxGain = ctx.createGain();
      ambGain.gain.value = ambOn ? ambVol : 0;
      sfxGain.gain.value = sfxOn ? sfxVol : 0;
      ambGain.connect(master);
      sfxGain.connect(master);
      noiseBuf = makeNoise(2);
    }
    if (ctx.state === 'suspended') {
      const p = ctx.resume();
      if (p && p.catch) p.catch(() => {});
    }
    return ctx;
  }

  function makeNoise(seconds) {
    const n = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  function osc(type, freq, dest) {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    o.connect(dest);
    return o;
  }

  function envGain(dest, start, peak, attack, release) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), start + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, start + attack + release);
    g.connect(dest);
    return g;
  }

  function tone({ type = 'sine', freq, dur = 0.6, peak = 0.12, attack = 0.02, dest }) {
    if (!ctx || !sfxOn) return;
    const t = now();
    const g = envGain(dest || sfxGain, t, peak, attack, dur);
    const o = osc(type, freq, g);
    o.start(t);
    o.stop(t + attack + dur + 0.05);
  }

  function noiseBurst({ dur = 0.12, peak = 0.08, freq = 1200, q = 0.8 }) {
    if (!ctx || !sfxOn || !noiseBuf) return;
    const t = now();
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = freq;
    bp.Q.value = q;
    const g = envGain(sfxGain, t, peak, 0.008, dur);
    src.connect(bp);
    bp.connect(g);
    src.start(t);
    src.stop(t + dur + 0.05);
  }

  function sfx(name) {
    unlock();
    if (!ctx || !sfxOn) return;
    if (name === 'ignite') {
      noiseBurst({ dur: 0.22, peak: 0.1, freq: 900, q: 0.6 });
      tone({ type: 'sawtooth', freq: 90, dur: 0.55, peak: 0.07, attack: 0.04 });
      tone({ type: 'sine', freq: 220, dur: 0.4, peak: 0.08, attack: 0.02 });
      const t = now();
      const g = envGain(sfxGain, t, 0.09, 0.05, 0.7);
      const o = osc('sine', 110, g);
      o.frequency.exponentialRampToValueAtTime(330, t + 0.45);
      o.start(t);
      o.stop(t + 0.8);
      return;
    }
    if (name === 'crystal') {
      const notes = [293.66, 440, 587.33, 739.99];
      notes.forEach((f, i) => {
        setTimeout(() => {
          tone({ freq: f, dur: 1.1, peak: 0.09 - i * 0.012, attack: 0.01 });
          tone({ type: 'triangle', freq: f * 2, dur: 0.5, peak: 0.03, attack: 0.005 });
        }, i * 90);
      });
      return;
    }
    if (name === 'distill') {
      [392, 329.63, 293.66, 246.94].forEach((f, i) => {
        setTimeout(() => tone({ freq: f, dur: 0.55, peak: 0.08, attack: 0.02 }), i * 110);
      });
      return;
    }
    if (name === 'derive') {
      [293.66, 349.23, 440, 587.33].forEach((f, i) => {
        setTimeout(() => tone({ freq: f, dur: 0.45, peak: 0.08, attack: 0.015 }), i * 95);
      });
      return;
    }
    if (name === 'compound') {
      tone({ freq: 329.63, dur: 0.7, peak: 0.07, attack: 0.04 });
      tone({ freq: 493.88, dur: 0.7, peak: 0.07, attack: 0.04 });
      setTimeout(() => tone({ freq: 392, dur: 0.9, peak: 0.1, attack: 0.02 }), 180);
      return;
    }
    if (name === 'click') {
      tone({ freq: 880, dur: 0.12, peak: 0.04, attack: 0.005 });
      return;
    }
    if (name === 'sparkle') {
      [1174.7, 1568, 1975.5].forEach((f, i) => {
        setTimeout(() => tone({ freq: f, dur: 0.35, peak: 0.05, attack: 0.005 }), i * 50);
      });
      return;
    }
    if (name === 'error') {
      tone({ type: 'square', freq: 110, dur: 0.35, peak: 0.06, attack: 0.01 });
      tone({ type: 'square', freq: 155.56, dur: 0.35, peak: 0.05, attack: 0.01 });
      return;
    }
    if (name === 'ui') {
      tone({ freq: 523.25, dur: 0.18, peak: 0.035, attack: 0.008 });
      return;
    }
    if (name === 'circle') {
      setCircle(true);
      return;
    }
    if (name === 'circleOff') {
      setCircle(false);
    }
  }

  function setCircle(on) {
    if (on) {
      if (circleStopTimer) {
        clearTimeout(circleStopTimer);
        circleStopTimer = null;
      }
      startCircle();
      return;
    }
    const left = CIRCLE_MIN_MS - (performance.now() - circleStartedAt);
    if (left > 80) {
      circleStopTimer = setTimeout(() => {
        circleStopTimer = null;
        stopCircle(false);
      }, left);
      return;
    }
    stopCircle(false);
  }

  function noiseLoop() {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    src.loop = true;
    return src;
  }

  function startCircle() {
    const ac = unlock();
    if (!ac || !sfxOn || !noiseBuf) return;
    const run = () => {
      if (!sfxOn || !noiseBuf) return;
      if (circleVoice) {
        circleStartedAt = performance.now();
        return;
      }
      circleStartedAt = performance.now();

      const t = now();
      const bus = ctx.createGain();
      bus.gain.setValueAtTime(0.0001, t);
      bus.gain.exponentialRampToValueAtTime(0.2, t + 0.22);
      bus.connect(sfxGain);

      const nodes = [];
      const sources = [];
      const keep = (n) => {
        nodes.push(n);
        return n;
      };

      const wind = noiseLoop();
      sources.push(wind);
      const hpW = ctx.createBiquadFilter();
      hpW.type = 'highpass';
      hpW.frequency.value = 160;
      const lpW = ctx.createBiquadFilter();
      lpW.type = 'lowpass';
      lpW.frequency.value = 720;
      lpW.Q.value = 0.35;
      const windG = ctx.createGain();
      windG.gain.value = 0.18;
      const wSweep = ctx.createGain();
      wSweep.gain.value = 480;
      const wLfo = keep(osc('sine', 0.11, wSweep));
      wSweep.connect(lpW.frequency);
      const wAmp = ctx.createGain();
      wAmp.gain.value = 0.06;
      const wAmpLfo = keep(osc('sine', 0.08, wAmp));
      wAmp.connect(windG.gain);
      wind.connect(hpW);
      hpW.connect(lpW);
      lpW.connect(windG);
      windG.connect(bus);

      const sand = noiseLoop();
      sources.push(sand);
      const hpS = ctx.createBiquadFilter();
      hpS.type = 'highpass';
      hpS.frequency.value = 2400;
      const bpS = ctx.createBiquadFilter();
      bpS.type = 'bandpass';
      bpS.frequency.value = 3200;
      bpS.Q.value = 1.4;
      const sandG = ctx.createGain();
      sandG.gain.value = 0.055;
      const sSpin = ctx.createGain();
      sSpin.gain.value = 1600;
      const sLfo = keep(osc('sine', 0.48, sSpin));
      sSpin.connect(bpS.frequency);
      sand.connect(hpS);
      hpS.connect(bpS);
      bpS.connect(sandG);
      sandG.connect(bus);

      wind.start(t);
      sand.start(t);
      wLfo.start(t);
      wAmpLfo.start(t);
      sLfo.start(t);

      circleVoice = { nodes, sources, bus, tickId: 0 };
    };

    if (ctx.state === 'suspended') {
      ctx.resume().then(run).catch(run);
      return;
    }
    run();
  }

  function stopCircle(immediate) {
    if (circleStopTimer) {
      clearTimeout(circleStopTimer);
      circleStopTimer = null;
    }
    if (!circleVoice) return;
    const v = circleVoice;
    circleVoice = null;
    if (v.tickId) clearInterval(v.tickId);
    if (!ctx) return;
    const t = now();
    try {
      v.bus.gain.cancelScheduledValues(t);
      const cur = Math.max(0.0002, v.bus.gain.value || 0.18);
      v.bus.gain.setValueAtTime(immediate ? 0.0001 : cur, t);
      if (!immediate) v.bus.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    } catch {
      /* ignore */
    }
    const halt = () => {
      v.nodes.forEach((n) => {
        try {
          if (n.stop) n.stop();
        } catch {
          /* already stopped */
        }
      });
      (v.sources || []).forEach((s) => {
        try {
          s.stop();
        } catch {
          /* ignore */
        }
      });
    };
    if (immediate) halt();
    else setTimeout(halt, 520);
  }

  function bedUrl() {
    try {
      return new URL(bedSrc, document.baseURI || location.href).href;
    } catch {
      return bedSrc;
    }
  }

  function ensureBed() {
    if (bed) return bed;
    bed = document.getElementById('furnace-bed');
    if (!bed) {
      bed = new Audio();
      bed.id = 'furnace-bed';
    }
    bed.loop = true;
    bed.preload = 'auto';
    if (!bed.getAttribute('src') && !bed.src) bed.src = bedUrl();
    bed.addEventListener('error', () => {
      console.warn('Athanor: 無法載入爐樂', bed.error || bed.src);
    });
    applyBedVolume();
    return bed;
  }

  function applyBedVolume() {
    if (!bed) return;
    const a = ambOn ? (ducking ? ambVol * 0.28 : ambVol) : 0;
    bed.volume = Math.max(0, Math.min(1, a));
  }

  async function startAmbient() {
    unlock();
    if (!ambOn) return;
    if (ctx && ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch {
        /* ignore */
      }
    }
    const el = ensureBed();
    applyBedVolume();
    try {
      await el.play();
      ambStarted = true;
    } catch (err) {
      console.warn('Athanor: 爐樂播放被擋', err);
      ambStarted = false;
    }
  }

  function stopAmbient() {
    ambStarted = false;
    if (bed) bed.pause();
  }

  function setAmbient(on) {
    ambOn = Boolean(on);
    if (!ambOn) stopAmbient();
    else startAmbient();
    applyGains();
  }

  function setSfx(on) {
    sfxOn = Boolean(on);
    if (!sfxOn) stopCircle(true);
    applyGains();
  }

  function setVolumes({ ambient, sfx }) {
    if (ambient != null) ambVol = clamp01(ambient);
    if (sfx != null) sfxVol = clamp01(sfx);
    applyGains();
  }

  function clamp01(v) {
    const n = Number(v);
    if (Number.isNaN(n)) return 0;
    return Math.max(0, Math.min(1, n));
  }

  function applyGains() {
    applyBedVolume();
    if (!ctx) return;
    const t = now();
    sfxGain.gain.setValueAtTime(sfxOn ? sfxVol : 0, t);
  }

  function duck(on) {
    ducking = Boolean(on);
    applyGains();
  }

  function applySettings(s) {
    setAmbient(s.ambientOn !== false);
    setSfx(s.sfxOn !== false);
    setVolumes({
      ambient: s.ambientVol == null ? 0.55 : Number(s.ambientVol),
      sfx: s.sfxVol == null ? 0.55 : Number(s.sfxVol),
    });
  }

  function isAmbientOn() {
    return ambOn;
  }

  function isPlaying() {
    return !!(bed && !bed.paused && !bed.ended && bed.currentTime >= 0);
  }

  function setBed(src) {
    if (!src) return;
    const next = String(src);
    const leaf = next.split('/').pop();
    const el = ensureBed();
    if (leaf && String(el.src || el.getAttribute('src') || '').includes(leaf)) return;
    const keep = ambOn && isPlaying();
    try {
      el.pause();
    } catch {
      /* ignore */
    }
    bedSrc = next;
    el.src = next;
    try {
      el.load();
    } catch {
      /* ignore */
    }
    applyBedVolume();
    if (keep) {
      const p = el.play();
      if (p && p.catch) p.catch(() => {});
    }
  }

  VA.audio = {
    unlock,
    startAmbient,
    stopAmbient,
    sfx,
    setCircle,
    setAmbient,
    setSfx,
    setVolumes,
    duck,
    applySettings,
    isAmbientOn,
    isPlaying,
    setBed,
  };
})(typeof window !== 'undefined' ? window : globalThis);

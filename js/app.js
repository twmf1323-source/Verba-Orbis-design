(function (global) {
  const VA = (global.VerbaAthanor = global.VerbaAthanor || {});

  let graph;
  let fx;
  let generationSeq = 0;
  const jobs = new Map();
  const pages = new Map();
  let currentAnalysis = null;
  let expanding = false;
  let cabinetDrag = null;

  function t(k) {
    return VA.i18n.t(k);
  }

  function langNow() {
    return VA.langs.currentId();
  }

  function viewing(lang) {
    return langNow() === lang;
  }

  function pageOf(lang) {
    const id = lang || langNow();
    if (!pages.has(id)) {
      pages.set(id, {
        analysis: null,
        graph: null,
        status: '',
        statusKind: '',
        idle: true,
        input: '',
      });
    }
    return pages.get(id);
  }

  function beginGeneration(lang) {
    const L = lang || langNow();
    const prev = jobs.get(L);
    prev?.controller.abort();
    generationSeq += 1;
    const controller = new AbortController();
    const job = { id: generationSeq, lang: L, controller };
    jobs.set(L, job);
    return { id: job.id, signal: controller.signal, lang: L };
  }

  function isCurrent(id, lang) {
    return jobs.get(lang || langNow())?.id === id;
  }

  function endJob(lang, id) {
    const job = jobs.get(lang);
    if (job && job.id === id) jobs.delete(lang);
  }

  function setPageStatus(msg, kind, lang) {
    const L = lang || langNow();
    const page = pageOf(L);
    page.status = msg || '';
    page.statusKind = kind || '';
    if (viewing(L)) VA.ui.setStatus(msg, kind);
  }

  function wait(ms, signal) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, ms);
      signal?.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      });
    });
  }

  function settings() {
    return VA.storage.loadSettings();
  }

  function apiOpts(signal) {
    const s = settings();
    const provider = s.provider || 'grok';
    return {
      provider,
      apiKey: VA.storage.getApiKey(provider),
      baseUrl: s.baseUrl,
      model: s.model,
      reasoningEffort: s.reasoningEffort,
      signal,
    };
  }

  function refreshRails(active) {
    VA.ui.renderHistory(VA.storage.loadHistory(), active);
    VA.ui.renderCabinet(VA.storage.loadCabinet());
  }

  function paintAnalysis(analysis, { reset, lang, persist, celebrate } = {}) {
    const L = lang || langNow();
    const doPersist = persist !== false;
    const doCelebrate = celebrate !== false;
    const page = pageOf(L);
    page.analysis = analysis;
    page.idle = false;
    page.graph = null;
    if (doPersist) {
      const { added } = VA.storage.collectMorphemes(analysis, L);
      VA.storage.upsertHistory(analysis, L);
      page.added = added;
    }
    if (!viewing(L)) {
      const spec = VA.langs.LANGS[L];
      const label = spec ? spec.label.zh : L;
      VA.ui.toast(`${label}爐已結晶 · ${analysis.lemma}`);
      return;
    }
    if (reset !== false) graph.clear();
    const center = { x: 2000, y: 2000 };
    const wordNode = graph.addNode({
      id: 'word:' + analysis.lemma,
      type: 'word',
      form: analysis.lemma,
      ipa: analysis.ipa,
      pos: analysis.pos,
      analysis,
      pinned: true,
      x: center.x,
      y: center.y,
      r: 96,
    });
    const morphs = analysis.morphemes || [];
    if (!VA.schema.isAtomicAnalysis(analysis) && morphs.length) {
      const morphNodes = morphs.map((m) =>
        graph.addNode({
          id: 'morph:' + m.id,
          type: 'morph',
          form: m.surface,
          gloss: m.meaningZh,
          kind: m.kind,
          morph: m,
          analysis,
          r: 58,
        })
      );
      graph.placeRing(center, morphNodes, 248);
      morphNodes.forEach((n) => graph.addLink(wordNode.id, n.id, 'morph'));
    }
    graph.focusWord();
    currentAnalysis = analysis;
    VA.ui.setIdle(false);
    graph.select(wordNode.id);
    VA.ui.setSheetOpen(false);
    VA.ui.setRailOpen(false);
    refreshRails(VA.schema.normalizeQuery(analysis.lemma));
    const added = page.added || [];
    if (doCelebrate && added.length) {
      VA.ui.toast(`${t('toast.newReagent')} · ${added[0].surface}`);
      VA.audio?.sfx('sparkle');
    }
    if (doCelebrate) {
      fx.burst();
      VA.audio?.sfx('crystal');
    }
    const input = document.getElementById('word-input');
    if (input) input.value = '';
    page.input = '';
    page.graph = graph.snapshot();
  }

  async function cast(raw, { forceApi, seedMorph, parentAnalysis, forceSplit } = {}) {
    const lang = langNow();
    if (seedMorph && !forceApi && !forceSplit) {
      const surface = String(seedMorph.surface || raw || '').trim();
      if (!surface) {
        setPageStatus(t('status.empty'), 'warn', lang);
        return;
      }
      document.getElementById('word-input').value = surface;
      const { id, signal } = beginGeneration(lang);
      VA.audio?.unlock();
      VA.audio?.startAmbient();
      VA.audio?.sfx('ignite');
      if (viewing(lang)) {
        VA.ui.setCasting(true);
        VA.ui.renderInspector(null);
      }
      setPageStatus(t('status.casting'), 'busy', lang);
      try {
        await wait(480, signal);
        if (!isCurrent(id, lang)) return;
        const analysis = VA.schema.normalizeAnalysis(
          VA.schema.analysisFromMorpheme(seedMorph, parentAnalysis || pageOf(lang).analysis || currentAnalysis),
          surface
        );
        setPageStatus(t('status.atomic'), 'ok', lang);
        paintAnalysis(analysis, { lang });
      } catch (err) {
        if (err?.name === 'AbortError') return;
        setPageStatus(err.message || String(err), 'err', lang);
        if (viewing(lang)) VA.audio?.sfx('error');
      } finally {
        endJob(lang, id);
        if (viewing(lang) && !jobs.get(lang)) VA.ui.setCasting(false);
      }
      return;
    }

    const normalized = VA.schema.normalizeQuery(raw);
    const gate = VA.schema.queryTooLong(normalized);
    if (!gate.ok) {
      setPageStatus(gate.reason === 'empty' ? t('status.empty') : t('status.tooLong'), 'warn', lang);
      return;
    }
    document.getElementById('word-input').value = raw.trim();
    const { id, signal } = beginGeneration(lang);
    VA.audio?.unlock();
    VA.audio?.startAmbient();
    VA.audio?.sfx('ignite');
    if (viewing(lang)) {
      VA.ui.setCasting(true);
      VA.ui.renderInspector(null);
    }
    setPageStatus(t('status.casting'), 'busy', lang);

    try {
      await wait(480, signal);
      if (!isCurrent(id, lang)) return;

      const demoHit = VA.demo.lookupAnalysis(normalized, lang);
      const key = VA.storage.getApiKey();
      let analysis;

      if (demoHit && !forceApi) {
        analysis = VA.schema.normalizeAnalysis(demoHit, raw.trim());
        setPageStatus(analysis.atomic ? t('status.atomic') : t('status.demo'), analysis.atomic ? 'ok' : 'demo', lang);
      } else {
        const cached = !forceApi && !forceSplit ? VA.storage.getHistoryByNormalized(normalized, lang) : null;
        const cab = VA.storage.loadCabinet(lang).find((row) => VA.schema.bareForm(row.surface) === VA.schema.bareForm(normalized));
        if (cached?.analysis) {
          analysis = VA.schema.normalizeAnalysis(cached.analysis, raw.trim());
          setPageStatus(t('status.cached'), 'ok', lang);
        } else if (cab && !forceApi && !forceSplit) {
          analysis = VA.schema.normalizeAnalysis(VA.schema.analysisFromMorpheme(cab), raw.trim());
          setPageStatus(t('status.atomic'), 'ok', lang);
        } else if (!key) {
          setPageStatus(t('status.needKey'), 'warn', lang);
          if (viewing(lang)) VA.ui.openSettings(true);
          return;
        } else {
          setPageStatus(forceSplit ? t('status.resplit') : t('status.crystallizing'), 'busy', lang);
          analysis = await VA.ai.analyzeWord({ word: raw.trim(), forceSplit, lang, ...apiOpts(signal) });
          if (!isCurrent(id, lang)) return;
          if (!analysis.morphemes.length) {
            analysis.morphemes = [VA.schema.atomicMorphemeFromAnalysis(analysis)];
          }
          setPageStatus(t('status.ready'), 'ok', lang);
        }
      }

      if (!analysis.morphemes.length) {
        analysis.morphemes = [VA.schema.atomicMorphemeFromAnalysis(analysis)];
      }
      paintAnalysis(analysis, { lang });
      if (!analysis.demo && key) {
        const miss = VA.schema.missingGlosses(analysis);
        if (miss.any) {
          VA.ai
            .ensureGlosses(analysis, { lang, ...apiOpts(signal) })
            .then((filled) => {
              if (!isCurrent(id, lang) || !filled) return;
              paintAnalysis(filled, { lang, celebrate: false });
            })
            .catch(() => {});
        }
      }
    } catch (err) {
      if (err?.name === 'AbortError') return;
      setPageStatus(err.message || String(err), 'err', lang);
      if (viewing(lang)) VA.audio?.sfx('error');
    } finally {
      endJob(lang, id);
      if (viewing(lang) && !jobs.get(lang)) VA.ui.setCasting(false);
    }
  }

  async function expand(op, morphNode) {
    if (!morphNode?.morph || expanding) return;
    const lang = langNow();
    const analysis = currentAnalysis;
    if (!analysis) return;
    const { id, signal } = beginGeneration(lang);
    expanding = true;
    setPageStatus(t('status.expanding'), 'busy', lang);
    VA.ui.renderInspector(morphNode, { expanding: true });

    try {
      const demoExp = VA.demo.lookupExpand(analysis.lemma, morphNode.morph, op, lang);
      const key = VA.storage.getApiKey();
      let result = demoExp;
      const demoEmpty = !demoExp.items.length;
      if (demoEmpty && key) {
        result = await VA.ai.expandMorpheme({
          op,
          morph: morphNode.morph,
          word: analysis.lemma,
          analysis,
          lang,
          ...apiOpts(signal),
        });
      } else if (demoEmpty && !key) {
        setPageStatus(t('status.needKey'), 'warn', lang);
        if (viewing(lang)) VA.ui.openSettings(true);
        return;
      }

      if (!isCurrent(id, lang)) return;
      if (!result.items.length) {
        setPageStatus(t('status.noExpand'), 'warn', lang);
        if (viewing(lang)) VA.audio?.sfx('error');
        return;
      }
      if (!viewing(lang)) {
        const spec = VA.langs.LANGS[lang];
        VA.ui.toast(`${spec ? spec.label.zh : lang}爐已析出`);
        return;
      }
      VA.audio?.sfx(op === 'distill' ? 'distill' : op === 'compound' ? 'compound' : 'derive');

      const fresh = [];
      for (const item of result.items) {
        const isHist =
          op === 'distill' ||
          /PIE|Lat|Gk|VL|OF|MF|OE|ME|OJ|MidJ|Ch|OK|SK/i.test(item.era || '') ||
          /^\*/.test(item.word);
        const node = graph.addNode({
          id: (isHist ? 'root:' : 'fam:') + VA.schema.fnv1aHex(item.word + op + morphNode.id),
          type: isHist ? 'root' : 'family',
          form: item.word,
          gloss: item.glossZh,
          pos: item.pos,
          era: item.era,
          rel: item.kind,
          link: item.linkZh,
          r: isHist ? 64 : 72,
        });
        fresh.push(node);
        graph.addLink(morphNode.id, node.id, op);
      }
      graph.placeFan(morphNode, fresh, op);
      graph.focusWord({ includeOuter: true });
      const label = op === 'compound' ? t('op.compound') : op === 'distill' ? t('op.distill') : t('op.derive');
      setPageStatus(`${t('status.ready')} · ${label} ${fresh.length}`, 'ok', lang);
      VA.ui.toast(`${label} · ${fresh.map((n) => n.form).slice(0, 3).join('、')}`);
      fx.ember();
      pageOf(lang).graph = graph.snapshot();
    } catch (err) {
      if (err?.name === 'AbortError') return;
      setPageStatus(err.message || String(err), 'err', lang);
    } finally {
      expanding = viewing(lang) ? false : expanding;
      endJob(lang, id);
      if (viewing(lang) && morphNode) VA.ui.renderInspector(graph.get(morphNode.id) || morphNode);
    }
  }

  function seedFromNode(node) {
    if (!node) return null;
    const m = node.morph;
    if (m) {
      return {
        surface: m.surface || node.form,
        kind: m.kind || node.kind,
        meaningZh: m.meaningZh || node.gloss || '',
        meaningFr: m.meaningFr || '',
        origin: m.origin || node.era || '',
        originForm: m.originForm || '',
        originPath: m.originPath || '',
        noteZh: m.noteZh || node.link || '',
        id: m.id,
      };
    }
    return {
      surface: node.form,
      kind: node.type === 'root' ? 'root' : node.kind || 'oth',
      meaningZh: node.gloss || '',
      meaningFr: '',
      origin: node.era || '',
      originForm: node.form || '',
      originPath: '',
      noteZh: node.link || '',
    };
  }

  function seedFromCabinet(row) {
    if (!row) return null;
    return {
      surface: row.surface,
      kind: row.kind,
      meaningZh: row.meaningZh || '',
      meaningFr: row.meaningFr || '',
      origin: row.origin || '',
      originForm: row.originForm || '',
      originPath: row.originPath || '',
      noteZh: row.noteZh || '',
      id: row.id,
    };
  }

  function ensureGuestNode(row, near, at) {
    const want = VA.schema.bareForm(row.surface);
    const existing =
      graph.all().find((n) => n.fromCabinet && (n.morph?.id === row.id || n.id === 'cab:' + row.id)) ||
      graph.all().find((n) => VA.schema.bareForm(n.form) === want);
    if (existing) return existing;
    let x;
    let y;
    if (at) {
      x = at.x;
      y = at.y;
    } else if (near) {
      const ang = Math.atan2(near.y - 2000, near.x - 2000) + 0.55;
      const rad = (near.r || 58) + 72;
      x = near.x + Math.cos(ang) * rad;
      y = near.y + Math.sin(ang) * rad;
    } else {
      x = 2000 + 220;
      y = 2000;
    }
    const node = graph.addNode({
      id: 'cab:' + row.id,
      type: 'morph',
      form: row.surface,
      gloss: row.meaningZh,
      kind: row.kind,
      morph: {
        id: row.id,
        surface: row.surface,
        kind: row.kind,
        meaningZh: row.meaningZh || '',
        meaningFr: row.meaningFr || '',
        origin: row.origin || '',
        originForm: row.originForm || '',
        originPath: row.originPath || '',
        noteZh: row.noteZh || '',
      },
      fromCabinet: true,
      analysis: currentAnalysis,
      r: 54,
      x,
      y,
    });
    node.tx = node.x;
    node.ty = node.y;
    return node;
  }

  function paintCombineItems(result, sourceNode, targetNode) {
    const fresh = [];
    for (const item of result.items) {
      const node = graph.addNode({
        id: 'fam:' + VA.schema.fnv1aHex(item.word + 'coniunctio' + (sourceNode?.id || '') + targetNode.id),
        type: 'family',
        form: item.word,
        gloss: item.glossZh,
        pos: item.pos,
        era: item.era,
        rel: item.kind,
        link: item.linkZh,
        r: 72,
      });
      fresh.push(node);
      graph.addLink(targetNode.id, node.id, 'compound');
      if (sourceNode && sourceNode.id !== targetNode.id) {
        graph.addLink(sourceNode.id, node.id, 'compound');
      }
    }
    graph.placeFan(targetNode, fresh, 'compound');
    graph.focusWord({ includeOuter: true });
    return fresh;
  }

  async function combineReagents(seedA, seedB, { sourceNode, targetNode, cabinetRow } = {}) {
    if (!seedA || !seedB || expanding) return;
    const lang = langNow();
    const formA = seedA.surface || seedA.form;
    const formB = seedB.surface || seedB.form;
    if (!formA || !formB) return;
    if (VA.schema.bareForm(formA) === VA.schema.bareForm(formB)) {
      setPageStatus(t('status.sameReagent'), 'warn', lang);
      return;
    }
    if (!targetNode) {
      setPageStatus(t('status.needGraph'), 'warn', lang);
      return;
    }
    const { id, signal } = beginGeneration(lang);
    expanding = true;
    setPageStatus(t('status.coniunctio'), 'busy', lang);

    let guest = sourceNode;
    if (cabinetRow && !guest) {
      guest = ensureGuestNode(cabinetRow, targetNode);
      graph.addLink(guest.id, targetNode.id, 'compound');
    }

    try {
      const demoHit = VA.demo.lookupConiunctio(formA, formB, lang);
      const key = VA.storage.getApiKey();
      let result = demoHit;
      const demoEmpty = !demoHit.items.length;
      if (demoEmpty && key) {
        result = await VA.ai.combineMorphemes({
          a: seedA,
          b: seedB,
          word: currentAnalysis?.lemma,
          analysis: currentAnalysis,
          lang,
          ...apiOpts(signal),
        });
      } else if (demoEmpty && !key) {
        setPageStatus(t('status.needKey'), 'warn', lang);
        if (viewing(lang)) VA.ui.openSettings(true);
        return;
      }

      if (!isCurrent(id, lang)) return;
      if (!result.items.length) {
        setPageStatus(t('status.noConiunctio'), 'warn', lang);
        if (viewing(lang)) {
          VA.audio?.sfx('error');
          if (guest) graph.select(guest.id);
        }
        return;
      }
      if (!viewing(lang)) {
        const spec = VA.langs.LANGS[lang];
        VA.ui.toast(`${spec ? spec.label.zh : lang}爐已析出`);
        return;
      }
      VA.audio?.sfx('compound');
      const fresh = paintCombineItems(result, guest, targetNode);
      setPageStatus(`${t('status.ready')} · ${t('op.compound')} ${fresh.length}`, 'ok', lang);
      VA.ui.toast(
        `${t('toast.coniunctio')} · ${formA} + ${formB} → ${fresh
          .map((n) => n.form)
          .slice(0, 3)
          .join('、')}`
      );
      fx.ember();
      graph.select(targetNode.id);
      pageOf(lang).graph = graph.snapshot();
    } catch (err) {
      if (err?.name === 'AbortError') return;
      setPageStatus(err.message || String(err), 'err', lang);
    } finally {
      if (viewing(lang)) expanding = false;
      endJob(lang, id);
      if (viewing(lang) && targetNode) VA.ui.renderInspector(graph.get(targetNode.id) || targetNode);
    }
  }

  function spawnGuestAt(row, clientX, clientY) {
    const at = graph.toWorld(clientX, clientY);
    const node = ensureGuestNode(row, null, at);
    graph.select(node.id);
    VA.ui.setCabinetMixEnabled(true);
    VA.ui.toast(t('toast.guestOnStage'));
    VA.audio?.sfx('sparkle');
  }

  function restoreHistory(normalized) {
    const lang = langNow();
    const row = VA.storage.getHistoryByNormalized(normalized, lang);
    if (!row?.analysis) return;
    const { id, signal } = beginGeneration(lang);
    const analysis = VA.schema.normalizeAnalysis(row.analysis, row.lemma);
    paintAnalysis(analysis, { lang, persist: false, celebrate: false });
    setPageStatus(t('status.saved'), 'ok', lang);
    const miss = VA.schema.missingGlosses(analysis);
    const key = VA.storage.getApiKey();
    if (miss.any && key && !analysis.demo) {
      VA.ai
        .ensureGlosses(analysis, { lang, ...apiOpts(signal) })
        .then((filled) => {
          if (!isCurrent(id, lang) || !filled) return;
          paintAnalysis(filled, { lang, persist: true, celebrate: false });
        })
        .catch(() => {})
        .finally(() => endJob(lang, id));
    } else {
      endJob(lang, id);
    }
  }

  function onSelect(node) {
    VA.ui.renderInspector(node, { expanding });
    VA.ui.setCabinetMixEnabled(Boolean(node) && graph.all().length > 0);
    if (node && node.type !== 'word') VA.ui.setSheetOpen(true);
  }

  function ttsOpts() {
    const s = settings();
    return {
      engine: s.ttsEngine || 'browser',
      apiKey: VA.storage.getApiKey('grok'),
      baseUrl: s.provider === 'grok' ? s.baseUrl : 'https://api.x.ai/v1',
    };
  }

  function markSpeaking(el, on) {
    document.querySelectorAll('.is-speaking').forEach((n) => n.classList.remove('is-speaking'));
    if (on && el) el.classList.add('is-speaking');
  }

  async function speakText(text, meta, el) {
    const result = await VA.tts.speak(text, meta, {
      ...ttsOpts(),
      onStart: () => {
        markSpeaking(el, true);
        VA.audio?.duck(true);
      },
      onEnd: () => {
        markSpeaking(el, false);
        VA.audio?.duck(false);
      },
    });
    if (!result.ok && result.reason === 'reconstructed') {
      VA.ui.setStatus(t('tts.reconstructed'), 'warn');
    } else if (!result.ok && result.reason && result.reason !== 'empty') {
      VA.ui.setStatus(t('tts.fail'), 'warn');
    }
    return result;
  }

  function speakNode(node) {
    if (!node || settings().clickSpeak === false) return;
    const era =
      node.era ||
      node.morph?.origin ||
      (node.type === 'word' || node.type === 'family' ? VA.langs.current().eraDefault : '');
    speakText(node.form, { era, origin: node.morph?.origin, historical: node.type === 'root' }, node.el);
  }

  function speakFromEvent(e, { force } = {}) {
    const btn = e.target.closest('[data-speak]');
    if (!btn) return false;
    if (!force && settings().clickSpeak === false && !btn.classList.contains('speak-word') && !btn.classList.contains('speak-line') && !btn.classList.contains('path-form')) {
      return false;
    }
    speakText(btn.getAttribute('data-speak'), { era: btn.getAttribute('data-speak-era') }, btn);
    return true;
  }

  function applyAudioFromSettings() {
    const s = settings();
    VA.audio.applySettings(s);
    VA.ui.updateAmbientBtn(s.ambientOn !== false);
    if (s.ambientOn !== false) {
      VA.audio.unlock();
      VA.audio.startAmbient();
    }
  }

  function liveAudioFromForm() {
    VA.audio.unlock();
    const on = document.getElementById('set-ambient').checked;
    VA.audio.setAmbient(on);
    VA.audio.setSfx(document.getElementById('set-sfx').checked);
    VA.audio.setVolumes({
      ambient: Number(document.getElementById('set-ambient-vol').value) / 100,
      sfx: Number(document.getElementById('set-sfx-vol').value) / 100,
    });
    if (on) VA.audio.startAmbient();
    VA.ui.updateAmbientBtn(on);
    VA.ui.syncVolOutputs();
    VA.storage.saveSettings({
      ambientOn: on,
      sfxOn: document.getElementById('set-sfx').checked,
      ambientVol: Number(document.getElementById('set-ambient-vol').value) / 100,
      sfxVol: Number(document.getElementById('set-sfx-vol').value) / 100,
    });
  }

  function liveFontFromForm(scale) {
    const n = VA.ui.applyFontScale(scale);
    VA.storage.saveSettings({ fontScale: n });
    return n;
  }

  function bind() {
    const form = document.getElementById('cast-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      cast(document.getElementById('word-input').value);
    });

    document.getElementById('inspector').addEventListener('click', (e) => {
      if (speakFromEvent(e, { force: true })) return;
      const opBtn = e.target.closest('[data-op]');
      if (!opBtn) return;
      const op = opBtn.getAttribute('data-op');
      const selected = graph.get(graph.selectedId);
      if (!selected) return;
      if (op === 'resplit') {
        const word = selected.analysis?.lemma || selected.form || '';
        if (!word) return;
        cast(word, { forceSplit: true });
        return;
      }
      if (op === 'transmute') {
        if (selected.type === 'morph' && selected.morph) {
          cast(selected.morph.surface, {
            seedMorph: selected.morph,
            parentAnalysis: selected.analysis || currentAnalysis,
          });
          return;
        }
        const formWord = selected.form || '';
        if (!formWord) return;
        if (/^\*/.test(formWord) || selected.type === 'root') {
          cast(formWord, {
            seedMorph: {
              surface: formWord,
              kind: 'root',
              meaningZh: selected.gloss || '',
              meaningFr: '',
              origin: selected.era || '',
              originForm: formWord,
              originPath: '',
              noteZh: selected.link || '',
            },
            parentAnalysis: currentAnalysis,
          });
          return;
        }
        cast(formWord, { forceApi: !VA.demo.lookupAnalysis(VA.schema.normalizeQuery(formWord)) });
        return;
      }
      expand(op, selected);
    });

    document.getElementById('grimoire-list').addEventListener('click', (e) => {
      const del = e.target.closest('[data-hist-del]');
      if (del) {
        e.preventDefault();
        e.stopPropagation();
        const normalized = del.getAttribute('data-hist-del');
        VA.storage.removeHistory(normalized);
        const active = currentAnalysis ? VA.schema.normalizeQuery(currentAnalysis.lemma) : '';
        refreshRails(active);
        VA.ui.renderGrimSettings();
        VA.ui.setStatus(t('rail.deleted'), 'ok');
        VA.audio.sfx('ui');
        return;
      }
      const btn = e.target.closest('[data-hist]');
      if (!btn) return;
      const normalized = btn.getAttribute('data-hist');
      const row = VA.storage.getHistoryByNormalized(normalized);
      if (row?.lemma && settings().clickSpeak !== false) {
        speakText(row.lemma, { era: VA.langs.current().eraDefault }, btn);
      }
      restoreHistory(normalized);
      VA.ui.setRailOpen(false);
    });

    function pointIn(el, x, y) {
      if (!el || el.classList.contains('hidden')) return false;
      const r = el.getBoundingClientRect();
      return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    }

    function endCabinetDrag(ev) {
      const drag = cabinetDrag;
      cabinetDrag = null;
      document.getElementById('stage')?.classList.remove('is-cabinet-drag');
      graph?.setDropTarget(null);
      VA.ui.hideCabGhost();
      if (!drag?.row) return;
      const row = drag.row;
      if (!drag.moved) {
        if (row.surface && settings().clickSpeak !== false) {
          speakText(row.surface, { origin: row.origin }, drag.el);
        }
        cast(row.surface, { seedMorph: row });
        VA.ui.setRailOpen(false);
        return;
      }
      const x = ev.clientX;
      const y = ev.clientY;
      if (pointIn(document.getElementById('inspector'), x, y)) return;
      const target = graph.hitAt(x, y);
      if (target) {
        combineReagents(seedFromCabinet(row), seedFromNode(target), {
          targetNode: target,
          cabinetRow: row,
        });
        return;
      }
      if (!pointIn(document.getElementById('stage'), x, y)) return;
      const idle = document.getElementById('stage').classList.contains('is-idle') || !graph.all().length;
      if (idle) cast(row.surface, { seedMorph: row });
      else spawnGuestAt(row, x, y);
    }

    document.getElementById('cabinet-list').addEventListener('pointerdown', (e) => {
      if (e.target.closest('[data-cab-mix]')) return;
      const item = e.target.closest('[data-cab]');
      if (!item) return;
      const id = item.getAttribute('data-cab');
      const row = VA.storage.loadCabinet().find((x) => x.id === id);
      if (!row) return;
      e.preventDefault();
      cabinetDrag = { id, row, el: item, x: e.clientX, y: e.clientY, moved: false, ghost: false };
      try {
        item.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    });
    document.getElementById('cabinet-list').addEventListener('pointermove', (e) => {
      if (!cabinetDrag) return;
      if (Math.hypot(e.clientX - cabinetDrag.x, e.clientY - cabinetDrag.y) > 8) cabinetDrag.moved = true;
      if (!cabinetDrag.moved) return;
      document.getElementById('stage').classList.add('is-cabinet-drag');
      if (!cabinetDrag.ghost) {
        VA.ui.showCabGhost(cabinetDrag.row, e.clientX, e.clientY);
        cabinetDrag.ghost = true;
      } else {
        VA.ui.moveCabGhost(e.clientX, e.clientY);
      }
      const overInsp = pointIn(document.getElementById('inspector'), e.clientX, e.clientY);
      const target = overInsp ? null : graph.hitAt(e.clientX, e.clientY);
      graph.setDropTarget(target?.id);
    });
    document.getElementById('cabinet-list').addEventListener('pointerup', endCabinetDrag);
    document.getElementById('cabinet-list').addEventListener('pointercancel', () => {
      cabinetDrag = null;
      document.getElementById('stage')?.classList.remove('is-cabinet-drag');
      graph?.setDropTarget(null);
      VA.ui.hideCabGhost();
    });
    document.getElementById('cabinet-list').addEventListener('click', (e) => {
      const mix = e.target.closest('[data-cab-mix]');
      if (!mix) return;
      e.preventDefault();
      e.stopPropagation();
      const id = mix.getAttribute('data-cab-mix');
      const row = VA.storage.loadCabinet().find((x) => x.id === id);
      const selected = graph.get(graph.selectedId);
      if (!row) return;
      if (!selected || document.getElementById('stage').classList.contains('is-idle')) {
        VA.ui.setStatus(t('status.needGraph'), 'warn');
        return;
      }
      combineReagents(seedFromCabinet(row), seedFromNode(selected), {
        targetNode: selected,
        cabinetRow: row,
      });
    });

    document.getElementById('clear-graph').addEventListener('click', () => {
      const lang = langNow();
      jobs.get(lang)?.controller.abort();
      jobs.delete(lang);
      graph.clear();
      currentAnalysis = null;
      expanding = false;
      const page = pageOf(lang);
      page.analysis = null;
      page.graph = null;
      page.idle = true;
      page.input = '';
      VA.ui.renderInspector(null);
      VA.ui.setIdle(true);
      VA.ui.setCasting(false);
      VA.ui.setCabinetMixEnabled(false);
      setPageStatus(t('cast.hint'), '', lang);
    });

    document.getElementById('grim-lang-list')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-clear-lang]');
      if (!btn || btn.disabled) return;
      const lang = btn.getAttribute('data-clear-lang');
      const spec = VA.langs.LANGS[lang];
      const label = spec ? `${spec.label.zh} · ${spec.label.native}` : lang;
      if (!window.confirm(`${t('settings.clearConfirmLang')}\n${label}`)) return;
      VA.storage.clearHistory(lang);
      const active = currentAnalysis ? VA.schema.normalizeQuery(currentAnalysis.lemma) : '';
      refreshRails(active);
      VA.ui.renderGrimSettings();
      VA.ui.setStatus(`${t('settings.clearedLang')} · ${label}`, 'ok');
      VA.audio.sfx('ui');
    });
    document.getElementById('clear-all-history')?.addEventListener('click', () => {
      if (!window.confirm(t('settings.clearConfirmAll'))) return;
      VA.storage.clearAllHistory();
      const active = currentAnalysis ? VA.schema.normalizeQuery(currentAnalysis.lemma) : '';
      refreshRails(active);
      VA.ui.renderGrimSettings();
      VA.ui.setStatus(t('settings.clearedAll'), 'ok');
      VA.audio.sfx('ui');
    });

    document.getElementById('ambient-btn').addEventListener('click', () => {
      VA.audio.unlock();
      if (!VA.audio.isPlaying()) {
        VA.storage.saveSettings({ ambientOn: true });
        VA.audio.setAmbient(true);
        VA.audio.startAmbient();
        VA.ui.updateAmbientBtn(true);
        VA.audio.sfx('ui');
        return;
      }
      const next = !VA.audio.isAmbientOn();
      VA.storage.saveSettings({ ambientOn: next });
      VA.audio.setAmbient(next);
      if (next) VA.audio.startAmbient();
      VA.ui.updateAmbientBtn(next);
      VA.audio.sfx('ui');
    });
    document.getElementById('rail-toggle')?.addEventListener('click', () => {
      const open = !document.getElementById('app')?.classList.contains('rail-open');
      VA.ui.setRailOpen(open);
      VA.audio.sfx('ui');
    });
    document.getElementById('rail-scrim')?.addEventListener('click', () => VA.ui.setRailOpen(false));
    document.getElementById('sheet-tabs')?.addEventListener('click', (e) => {
      const tab = e.target.closest('[data-sheet-tab]');
      if (!tab) return;
      VA.ui.showSheetTab(tab.getAttribute('data-sheet-tab'));
      VA.ui.setSheetOpen(true);
      VA.audio.sfx('ui');
    });
    const grab = document.getElementById('insp-grab');
    if (grab) {
      let sheetDrag = null;
      grab.addEventListener('pointerdown', (e) => {
        sheetDrag = { y: e.clientY, moved: false };
        try {
          grab.setPointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
      });
      grab.addEventListener('pointermove', (e) => {
        if (!sheetDrag) return;
        const dy = sheetDrag.y - e.clientY;
        if (Math.abs(dy) > 12) sheetDrag.moved = true;
        if (dy > 28) VA.ui.setSheetOpen(true);
        if (dy < -28) VA.ui.setSheetOpen(false);
      });
      grab.addEventListener('pointerup', (e) => {
        if (!sheetDrag) return;
        if (!sheetDrag.moved) {
          const root = document.getElementById('inspector');
          VA.ui.setSheetOpen(!root?.classList.contains('is-open'));
        }
        sheetDrag = null;
        VA.audio.sfx('ui');
      });
    }
    document.getElementById('settings-btn').addEventListener('click', () => {
      VA.ui.setRailOpen(false);
      const s = settings();
      VA.ui.fillSettings(s, VA.storage.getApiKey(s.provider));
      VA.ui.openSettings(true);
      VA.audio.sfx('ui');
    });
    document.getElementById('settings-tabs')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-set-tab]');
      if (!btn) return;
      const tab = btn.getAttribute('data-set-tab');
      VA.ui.showSettingsTab(tab);
      if (tab === 'grimoire') VA.ui.renderGrimSettings();
      VA.audio.sfx('ui');
    });
    document.getElementById('settings-tabs')?.addEventListener('keydown', (e) => {
      if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;
      const tabs = [...document.querySelectorAll('#settings-tabs [data-set-tab]')];
      const i = tabs.findIndex((b) => b.classList.contains('is-on'));
      if (i < 0) return;
      const delta = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
      const next = delta ? (i + delta + tabs.length) % tabs.length : e.key === 'Home' ? 0 : tabs.length - 1;
      if (next === i) return;
      e.preventDefault();
      VA.ui.showSettingsTab(tabs[next].getAttribute('data-set-tab'));
      tabs[next].focus();
      VA.audio.sfx('ui');
    });
    document.querySelectorAll('[data-settings-close]').forEach((btn) => {
      btn.addEventListener('click', () => VA.ui.openSettings(false));
    });
    document.getElementById('settings-overlay').addEventListener('click', (e) => {
      if (e.target.id === 'settings-overlay') VA.ui.openSettings(false);
    });
    document.getElementById('provider-row').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-provider]');
      if (!btn) return;
      const next = btn.getAttribute('data-provider');
      const prev = VA.ui.selectedProvider();
      if (prev === next) return;
      const raw = document.getElementById('set-key').value;
      const detected = VA.ai.detectProvider(raw);
      if (detected === next) {
        VA.ui.applyProvider(next, { fillDefaults: true, apiKey: raw });
        return;
      }
      if (prev) VA.storage.setApiKey(raw, prev);
      VA.ui.applyProvider(next, {
        fillDefaults: true,
        apiKey: VA.storage.getApiKey(next),
      });
    });
    const onKeyDetect = () => {
      const raw = document.getElementById('set-key').value;
      const detected = VA.ai.detectProvider(raw);
      if (!detected || detected === VA.ui.selectedProvider()) return;
      VA.ui.applyProvider(detected, { fillDefaults: true, apiKey: raw });
    };
    document.getElementById('set-key').addEventListener('change', onKeyDetect);
    document.getElementById('set-key').addEventListener('paste', () => setTimeout(onKeyDetect, 0));
    document.getElementById('settings-save').addEventListener('click', () => {
      const provider = VA.ui.selectedProvider();
      const spec = VA.ai.PROVIDERS[provider] || VA.ai.PROVIDERS.grok;
      VA.storage.setApiKey(document.getElementById('set-key').value, provider);
      VA.storage.saveSettings({
        provider,
        model: document.getElementById('set-model').value.trim() || spec.model,
        reasoningEffort: document.getElementById('set-effort').value,
        baseUrl: document.getElementById('set-base').value.trim() || spec.baseUrl,
        clickSpeak: document.getElementById('set-click-speak').checked,
        ttsEngine: document.getElementById('set-tts-engine').value || 'browser',
        ambientOn: document.getElementById('set-ambient').checked,
        sfxOn: document.getElementById('set-sfx').checked,
        ambientVol: Number(document.getElementById('set-ambient-vol').value) / 100,
        sfxVol: Number(document.getElementById('set-sfx-vol').value) / 100,
        fontScale: VA.ui.clampFontScale(Number(document.getElementById('set-font-scale').value) / 100),
      });
      VA.ui.applyFontScale(VA.storage.loadSettings().fontScale);
      applyAudioFromSettings();
      VA.ui.openSettings(false);
      VA.ui.setStatus(`爐房設定已保存 · ${spec.label}`, 'ok');
    });
    document.getElementById('copy-radix').addEventListener('click', () => {
      const r = VA.storage.copyKeyFromRadix();
      if (r.ok) {
        VA.ui.applyProvider('grok', { fillDefaults: true, apiKey: VA.storage.getApiKey('grok') });
        VA.ui.setStatus('已從 Verba 系列複製 Grok 金鑰', 'ok');
      } else {
        VA.ui.setStatus('找不到 Radix / Orbis 的金鑰', 'warn');
      }
    });

    document.getElementById('lang-switch').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-lang]');
      if (!btn) return;
      switchLang(btn.getAttribute('data-lang'));
      VA.audio.sfx('click');
    });
    ['set-ambient', 'set-sfx', 'set-ambient-vol', 'set-sfx-vol'].forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', liveAudioFromForm);
      el.addEventListener('change', liveAudioFromForm);
    });
    const fontSlider = document.getElementById('set-font-scale');
    if (fontSlider) {
      fontSlider.addEventListener('input', () => liveFontFromForm(Number(fontSlider.value) / 100));
      fontSlider.addEventListener('change', () => liveFontFromForm(Number(fontSlider.value) / 100));
    }
    document.querySelectorAll('[data-font-preset]').forEach((btn) => {
      btn.addEventListener('click', () => {
        liveFontFromForm(Number(btn.getAttribute('data-font-preset')));
        VA.audio.sfx('ui');
      });
    });

    document.getElementById('rail-tabs').addEventListener('click', (e) => {
      const tab = e.target.closest('[data-tab]');
      if (!tab) return;
      const name = tab.getAttribute('data-tab');
      document.querySelectorAll('[data-tab]').forEach((x) => x.classList.toggle('is-on', x === tab));
      document.getElementById('grimoire-pane').classList.toggle('hidden', name !== 'grimoire');
      document.getElementById('cabinet-pane').classList.toggle('hidden', name !== 'cabinet');
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (document.getElementById('app')?.classList.contains('rail-open')) {
          VA.ui.setRailOpen(false);
          return;
        }
        const sheet = document.getElementById('inspector');
        if (sheet?.classList.contains('is-open')) {
          VA.ui.setSheetOpen(false);
          return;
        }
        if (!document.getElementById('settings-overlay')?.classList.contains('hidden')) {
          VA.ui.openSettings(false);
        }
      }
      if (e.key === '/' && document.activeElement?.id !== 'word-input' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        document.getElementById('word-input').focus();
      }
    });
  }

  function applyLangChrome() {
    const p = VA.langs.current();
    document.querySelectorAll('#lang-switch [data-lang]').forEach((btn) => {
      btn.classList.toggle('is-on', btn.getAttribute('data-lang') === p.id);
    });
    const tag = document.querySelector('.brand-tag');
    if (tag) tag.textContent = p.tag;
    const input = document.getElementById('word-input');
    if (input) input.placeholder = p.placeholder;
    document.title = `Verba Athanor · ${p.label.zh}`;
    const app = document.getElementById('app');
    if (app) {
      app.classList.remove('theme-xian', 'theme-seowon', 'theme-fleur');
      if (p.theme && p.theme !== 'west') app.classList.add('theme-' + p.theme);
    }
    const inspector = document.getElementById('inspector');
    if (inspector) {
      inspector.dataset.skin = p.id === 'ja' || p.id === 'ko' ? 'scroll' : 'parchment';
    }
    const hint = document.querySelector('.crucible-hint');
    if (hint) hint.textContent = p.crucibleHint || 'Solve et coagula';
    const idle = document.getElementById('idle-hint');
    if (idle) idle.textContent = p.crucibleHint || 'Solve et coagula';
    if (VA.audio?.setBed && p.bedSrc) VA.audio.setBed(p.bedSrc);
    VA.ui.renderExamples();
  }

  function stashPage(lang) {
    const page = pageOf(lang);
    page.analysis = currentAnalysis;
    page.idle = !currentAnalysis && !jobs.get(lang);
    const input = document.getElementById('word-input');
    page.input = input ? input.value : '';
    const status = document.getElementById('status');
    if (status) {
      page.status = status.textContent || page.status;
      page.statusKind = status.dataset.kind || page.statusKind;
    }
    if (graph && (currentAnalysis || graph.all().length)) page.graph = graph.snapshot();
  }

  function restorePage(lang) {
    const page = pageOf(lang);
    const p = VA.langs.current();
    expanding = false;
    currentAnalysis = page.analysis;
    const input = document.getElementById('word-input');
    if (input) input.value = page.input || '';
    const job = jobs.get(lang);
    if (job) {
      VA.ui.setCasting(true);
      VA.ui.setStatus(page.status || t('status.crystallizing'), page.statusKind || 'busy');
    } else {
      VA.ui.setCasting(false);
      if (page.analysis) VA.ui.setStatus(page.status || t('status.ready'), page.statusKind || 'ok');
      else VA.ui.setStatus(`${p.label.zh}爐已就緒 · ${t('cast.hint')}`);
    }
    if (page.graph?.nodes?.length) {
      graph.restore(page.graph);
      VA.ui.setIdle(false);
      const selected = graph.get(graph.selectedId) || graph.all().find((n) => n.type === 'word');
      if (selected) {
        VA.ui.renderInspector(selected, { expanding: false });
        VA.ui.setSheetOpen(selected.type !== 'word');
      } else {
        VA.ui.renderInspector(page.analysis ? { type: 'word', form: page.analysis.lemma, analysis: page.analysis } : null);
      }
    } else if (page.analysis && !job) {
      paintAnalysis(page.analysis, { lang, persist: false, celebrate: false });
    } else {
      graph.clear();
      VA.ui.setIdle(true);
      VA.ui.renderInspector(null);
      VA.ui.setSheetOpen(false);
    }
    refreshRails(currentAnalysis ? VA.schema.normalizeQuery(currentAnalysis.lemma) : '');
  }

  function switchLang(id) {
    if (!id || id === langNow()) return;
    const from = langNow();
    stashPage(from);
    expanding = false;
    VA.langs.setLang(id);
    applyLangChrome();
    restorePage(id);
    try {
      const url = new URL(location.href);
      url.searchParams.set('lang', id);
      history.replaceState(null, '', url);
    } catch {
      /* file:// */
    }
  }

  function init() {
    VA.storage.bootstrapConfig();
    try {
      const q = new URLSearchParams(location.search).get('lang');
      if (q === 'en' || q === 'fr' || q === 'ja' || q === 'ko') VA.storage.saveSettings({ lang: q });
    } catch {
      /* file:// */
    }
    VA.i18n.apply();
    VA.ui.applyFontScale(settings().fontScale);
    applyLangChrome();
    VA.ui.setIdle(true);
    VA.ui.renderInspector(null);
    VA.ui.setStatus(t('cast.hint'));
    refreshRails('');

    graph = VA.graph.create({
      stage: document.getElementById('stage'),
      world: document.getElementById('world'),
      linksSvg: document.getElementById('links'),
      nodesEl: document.getElementById('nodes'),
      onSelect,
      onActivate: speakNode,
      onMix: (source, target) => {
        combineReagents(seedFromNode(source), seedFromNode(target), {
          sourceNode: source,
          targetNode: target,
        });
      },
      renderNode: VA.ui.renderNode,
    });
    fx = VA.fx.create(document.getElementById('fx'));
    fx.start();
    VA.ui.updateAmbientBtn(settings().ambientOn !== false);
    const unlockOnce = () => {
      applyAudioFromSettings();
    };
    document.addEventListener('pointerdown', unlockOnce, { once: true });
    document.addEventListener('keydown', unlockOnce, { once: true });
    bind();
    try {
      const tab = new URLSearchParams(location.search).get('settings');
      if (tab != null) {
        const s = settings();
        VA.ui.fillSettings(s, VA.storage.getApiKey(s.provider));
        const id = ['api', 'voice', 'display', 'audio'].includes(tab) ? tab : 'api';
        VA.ui.openSettings(true, id);
      }
    } catch {
      /* file:// */
    }
    global.__VERBA_ATHANOR_READY__ = true;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(typeof window !== 'undefined' ? window : globalThis);

(function (global) {
  const VA = (global.VerbaAthanor = global.VerbaAthanor || {});
  const t = (k) => VA.i18n.t(k);

  function esc(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function eraDefault() {
    return VA.langs?.current?.()?.eraDefault || 'Fr';
  }

  function speakAttrs(text, era) {
    return `data-speak="${esc(text)}" data-speak-era="${esc(era || eraDefault())}"`;
  }

  function renderNode(node) {
    const el = document.createElement('button');
    el.type = 'button';
    el.setAttribute('aria-label', `朗讀 ${node.form || ''}`);
    if (node.type === 'word') {
      const zh = node.analysis?.glossZh || '';
      el.innerHTML = `
        <span class="node-kicker">整詞 · ♪</span>
        <span class="node-form">${esc(node.form)}</span>
        <span class="node-sub">${esc(zh || node.ipa || '')}${!zh && node.pos ? ' · ' + esc(node.pos) : zh && node.pos ? ' · ' + esc(node.pos) : ''}</span>
      `;
    } else if (node.type === 'morph') {
      const meta = VA.schema.kindMeta(node.kind);
      const kicker = node.fromCabinet ? `${esc(t('inspector.cabinet'))} · ♪` : `${esc(meta.zh)} · ♪`;
      const zh = VA.schema.hasZh?.(node.gloss) ? node.gloss : node.morph?.meaningZh || '';
      el.innerHTML = `
        <span class="node-principle">${kicker}</span>
        <span class="node-form">${esc(node.form)}</span>
        <span class="node-sub">${esc(zh || node.morph?.meaningFr || meta.zh)}</span>
      `;
    } else if (node.type === 'root') {
      const via = VA.schema.viaLabel(node.via);
      el.innerHTML = `
        <span class="node-kicker">${esc(node.era || '原質')}${via ? ' · ' + esc(via) : ''} · ♪</span>
        <span class="node-form">${esc(node.form)}</span>
        <span class="node-sub">${esc(node.gloss || '')}</span>
      `;
    } else {
      el.innerHTML = `
        <span class="node-kicker">${esc(node.rel || '派生')} · ♪</span>
        <span class="node-form">${esc(node.form)}</span>
        <span class="node-sub">${esc(node.gloss || '')}</span>
      `;
    }
    return el;
  }

  function attestBlock(analysis) {
    const view = VA.schema.formatFirstAttested(analysis?.firstAttested);
    if (!view) return '';
    const era = analysis.firstAttested?.era || '';
    const cert = view.certLabel
      ? `<span class="path-cert cert-${esc(view.certainty)}">${esc(view.certLabel)}</span>`
      : '';
    return `
      <div class="insp-attest">
        <p class="insp-label">${esc(t('inspector.attested'))}</p>
        ${view.head ? `<p class="attest-when"><span>${esc(view.head)}</span>${cert}</p>` : cert ? `<p class="attest-when">${cert}</p>` : ''}
        ${view.whereZh ? `<p class="attest-where">${esc(view.whereZh)}</p>` : ''}
        ${
          view.form
            ? `<p class="attest-form">形式 <button type="button" class="path-form" ${speakAttrs(view.form, era)}>${esc(view.form)}</button></p>`
            : ''
        }
        ${view.cite ? `<p class="attest-cite">${esc(t('inspector.attestedWork'))} ${esc(view.cite)}</p>` : ''}
        ${view.sourceZh ? `<p class="attest-src">${esc(t('inspector.attestedLex'))} ${esc(view.sourceZh)}</p>` : ''}
      </div>`;
  }

  function pathColumn(path) {
    if (!path?.length) return '';
    const steps = path
      .map((p, i) => {
        const eraName = VA.schema.originLabel(p.era) || p.era;
        const via = VA.schema.viaLabel(p.via);
        const cert = VA.schema.certaintyLabel(p.certainty);
        return `
      <li class="path-step" style="--i:${i}">
        <span class="path-era">
          ${esc(eraName)}
          ${via ? `<span class="path-via">${esc(via)}</span>` : ''}
          ${cert ? `<span class="path-cert cert-${esc(p.certainty || '')}">${esc(cert)}</span>` : ''}
        </span>
        <button type="button" class="path-form" ${speakAttrs(p.form, p.era)}>${esc(p.form)}</button>
        <span class="path-gloss">${esc(p.glossZh || '')}</span>
        ${p.noteZh ? `<span class="path-note">${esc(p.noteZh)}</span>` : ''}
      </li>`;
      })
      .join('');
    return `<ol class="path-col">${steps}</ol>`;
  }

  function morphRoster(morphs) {
    if (!morphs?.length) return '';
    const rows = morphs
      .map((m) => {
        const meta = VA.schema.kindMeta(m.kind);
        const gloss = VA.schema.hasZh?.(m.meaningZh) ? m.meaningZh : m.meaningZh || m.meaningFr || '（尚無中文註釋）';
        const origin = [VA.schema.originLabel(m.origin), m.originForm].filter(Boolean).join(' ');
        const lineage = m.originPath || VA.schema.formatOriginPath(VA.schema.lineageFromMorpheme(m));
        return `
        <li class="roster-row">
          <button type="button" class="roster-form" ${speakAttrs(m.surface, m.origin)}>${esc(m.surface)}</button>
          <span class="roster-kind">${esc(meta.zh)}</span>
          <span class="roster-gloss">${esc(gloss)}</span>
          ${m.meaningFr ? `<span class="roster-fr">${esc(m.meaningFr)}</span>` : ''}
          ${origin ? `<span class="roster-origin">${esc(origin)}</span>` : ''}
          ${lineage ? `<span class="roster-lineage">${esc(lineage)}</span>` : ''}
          ${m.noteZh ? `<span class="roster-note">${esc(m.noteZh)}</span>` : ''}
        </li>`;
      })
      .join('');
    return `<p class="insp-label">語素註釋</p><ul class="morph-roster">${rows}</ul>`;
  }

  function morphOps(disabled) {
    const d = disabled ? 'disabled' : '';
    return `
      <div class="op-grid">
        <button type="button" class="op-btn" data-op="distill" ${d}>
          <span class="op-alch">🜄</span>
          <span class="op-name">${esc(t('op.distill'))}</span>
          <span class="op-hint">${esc(t('op.distillHint'))}</span>
        </button>
        <button type="button" class="op-btn" data-op="derive" ${d}>
          <span class="op-alch">🜂</span>
          <span class="op-name">${esc(t('op.derive'))}</span>
          <span class="op-hint">${esc(t('op.deriveHint'))}</span>
        </button>
        <button type="button" class="op-btn" data-op="compound" ${d}>
          <span class="op-alch">🜃</span>
          <span class="op-name">${esc(t('op.compound'))}</span>
          <span class="op-hint">${esc(t('op.compoundHint'))}</span>
        </button>
      </div>
      <button type="button" class="op-btn op-single" data-op="transmute">
        <span class="op-alch">🜁</span>
        <span class="op-name">${esc(t('op.transmute'))}</span>
        <span class="op-hint">${esc(t('op.transmuteMorphHint'))}</span>
      </button>`;
  }

  function resplitBtn() {
    return `
      <button type="button" class="op-btn op-single" data-op="resplit">
        <span class="op-alch">🜍</span>
        <span class="op-name">${esc(t('op.resplit'))}</span>
        <span class="op-hint">${esc(t('op.resplitHint'))}</span>
      </button>`;
  }

  function inspectorRoot() {
    return document.getElementById('inspector');
  }

  function inspectorBox() {
    return document.getElementById('inspector-body') || document.getElementById('inspector');
  }

  function setSheetOpen(on) {
    const root = inspectorRoot();
    if (!root) return;
    root.classList.toggle('is-open', Boolean(on));
    const grab = document.getElementById('insp-grab');
    if (grab) grab.setAttribute('aria-expanded', on ? 'true' : 'false');
    window.dispatchEvent(new Event('resize'));
  }

  function fillSheetTabs(tabs, active) {
    const el = document.getElementById('sheet-tabs');
    if (!el) return;
    const list = (tabs || []).filter((tab) => tab && tab.id);
    if (!list.length) {
      el.innerHTML = '';
      el.hidden = true;
      return;
    }
    const current = list.some((tab) => tab.id === active) ? active : list[0].id;
    el.hidden = false;
    el.innerHTML = list
      .map(
        (tab) =>
          `<button type="button" role="tab" data-sheet-tab="${esc(tab.id)}" aria-selected="${tab.id === current ? 'true' : 'false'}" class="${tab.id === current ? 'is-on' : ''}">${esc(tab.label)}</button>`
      )
      .join('');
    showSheetTab(current);
  }

  function showSheetTab(id) {
    const root = inspectorRoot();
    const tab = String(id || 'word');
    root?.setAttribute('data-sheet', tab);
    document.querySelectorAll('#sheet-tabs [data-sheet-tab]').forEach((btn) => {
      const on = btn.getAttribute('data-sheet-tab') === tab;
      btn.classList.toggle('is-on', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
    });
  }

  function setRailOpen(on) {
    const app = document.getElementById('app');
    const scrim = document.getElementById('rail-scrim');
    const btn = document.getElementById('rail-toggle');
    const open = Boolean(on);
    app?.classList.toggle('rail-open', open);
    if (scrim) scrim.hidden = !open;
    if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function renderGuide() {
    const root = inspectorRoot();
    const box = inspectorBox();
    const p = VA.langs?.current?.() || {};
    const lang = [p.label?.zh, p.label?.native].filter(Boolean).join(' · ');
    root?.classList.add('is-guide');
    root?.classList.remove('hidden', 'is-open');
    root?.removeAttribute('data-sheet');
    fillSheetTabs([]);
    setSheetOpen(false);
    if (box) box.innerHTML = `
      <div class="insp-head">
        <p class="insp-kicker">${esc(t('guide.kicker'))}</p>
        <h2>${esc(t('guide.title'))}</h2>
        <p class="insp-meta">${esc(lang)}</p>
        <p class="insp-gloss">${esc(t('guide.lead'))}</p>
      </div>
      <ol class="guide-steps">
        <li><b>1 · ${esc(t('guide.s1'))}</b><span>${esc(t('guide.s1d'))}</span></li>
        <li><b>2 · ${esc(t('guide.s2'))}</b><span>${esc(t('guide.s2d'))}</span></li>
        <li><b>3 · ${esc(t('guide.s3'))}</b><span>${esc(t('guide.s3d'))}</span></li>
        <li><b>4 · ${esc(t('guide.s4'))}</b><span>${esc(t('guide.s4d'))}</span></li>
        <li><b>5 · ${esc(t('guide.s5'))}</b><span>${esc(t('guide.s5d'))}</span></li>
        <li><b>6 · ${esc(t('guide.s6'))}</b><span>${esc(t('guide.s6d'))}</span></li>
      </ol>
    `;
  }

  function renderInspector(node, { expanding } = {}) {
    const root = inspectorRoot();
    const box = inspectorBox();
    if (!node) {
      renderGuide();
      return;
    }
    root?.classList.remove('hidden', 'is-guide');
    if (!box) return;
    if (node.type === 'word') {
      const a = node.analysis || {};
      box.innerHTML = `
        <div class="insp-head">
          <p class="insp-kicker">${esc(t('inspector.word'))}</p>
          <h2><button type="button" class="speak-word" ${speakAttrs(a.lemma || node.form, eraDefault())}>${esc(a.lemma || node.form)}</button></h2>
          <p class="insp-meta">${esc(a.ipa || '')} · ${esc(a.pos || '')}${a.gender ? ' · ' + esc(a.gender) : ''}</p>
          <p class="insp-gloss">${esc(a.glossZh || '（尚無中文釋義）')}</p>
          <p class="insp-fr">${esc(a.glossFr)}</p>
        </div>
        <div data-sheet-pane="word">
          ${attestBlock(a)}
          ${a.alchNoteZh ? `<p class="insp-note">${esc(a.alchNoteZh)}</p>` : ''}
          ${
            a.example?.fr
              ? `<blockquote class="insp-ex"><button type="button" class="speak-line" ${speakAttrs(a.example.fr, eraDefault())}>${esc(a.example.fr)}</button><small>${esc(a.example.zh)}</small></blockquote>`
              : ''
          }
        </div>
        <div data-sheet-pane="morphs">
          ${morphRoster(a.morphemes)}
          ${VA.schema.isAtomicAnalysis(a) ? resplitBtn() : ''}
        </div>
        <div data-sheet-pane="path">
          <p class="insp-label">${esc(t('inspector.path'))}</p>
          ${pathColumn(a.path)}
          <p class="ai-badge">${esc(t('ai.badge'))}</p>
        </div>
      `;
      fillSheetTabs(
        [
          { id: 'word', label: t('sheet.tabWord') },
          a.morphemes?.length ? { id: 'morphs', label: t('sheet.tabMorphs') } : null,
          a.path?.length ? { id: 'path', label: t('sheet.tabPath') } : null,
        ],
        'word'
      );
      return;
    }
    if (node.type === 'morph') {
      const m = node.morph || {};
      const meta = VA.schema.kindMeta(m.kind);
      const lineage = VA.schema.lineageFromMorpheme(m, node.analysis?.path);
      box.innerHTML = `
        <div class="insp-head">
          <p class="insp-kicker">${esc(t('inspector.morph'))} · ${esc(meta.zh)}</p>
          <h2><button type="button" class="speak-word" ${speakAttrs(m.surface, m.origin)}>${esc(m.surface)}</button></h2>
          <p class="insp-meta">${esc(VA.schema.originLabel(m.origin))} ${esc(m.originForm || '')}</p>
          <p class="insp-gloss">${esc(m.meaningZh || '（尚無中文註釋）')}</p>
          <p class="insp-fr">${esc(m.meaningFr)}</p>
        </div>
        <div data-sheet-pane="word">
          ${m.noteZh ? `<p class="insp-note">${esc(m.noteZh)}</p>` : ''}
        </div>
        <div data-sheet-pane="morphs">
          ${morphOps(expanding)}
          ${VA.schema.isAtomicAnalysis(node.analysis || {}) ? resplitBtn() : ''}
        </div>
        <div data-sheet-pane="path">
          <p class="insp-label">${esc(t('inspector.lineage'))}</p>
          ${pathColumn(lineage)}
        </div>
      `;
      fillSheetTabs(
        [
          { id: 'word', label: t('sheet.tabWord') },
          { id: 'morphs', label: t('sheet.tabOps') },
          lineage?.length ? { id: 'path', label: t('sheet.tabPath') } : null,
        ],
        'word'
      );
      return;
    }
    if (node.type === 'root') {
      box.innerHTML = `
        <div class="insp-head">
          <p class="insp-kicker">${esc(t('inspector.root'))}</p>
          <h2><button type="button" class="speak-word" ${speakAttrs(node.form, node.era)}>${esc(node.form)}</button></h2>
          <p class="insp-meta">${esc(VA.schema.originLabel(node.era) || node.era || '')}${VA.schema.viaLabel(node.via) ? ' · ' + esc(VA.schema.viaLabel(node.via)) : ''}</p>
          <p class="insp-gloss">${esc(node.gloss || '')}</p>
        </div>
        <div data-sheet-pane="word">
          ${node.link ? `<p class="insp-note">${esc(node.link)}</p>` : ''}
        </div>
        <div data-sheet-pane="morphs">
          <button type="button" class="op-btn op-single" data-op="transmute">
            <span class="op-name">${esc(t('op.transmute'))}</span>
            <span class="op-hint">${esc(VA.langs?.current?.()?.modernWordHint || t('op.transmuteHint'))}</span>
          </button>
        </div>
      `;
      fillSheetTabs(
        [
          { id: 'word', label: t('sheet.tabWord') },
          { id: 'morphs', label: t('sheet.tabOps') },
        ],
        'word'
      );
      return;
    }
    box.innerHTML = `
      <div class="insp-head">
        <p class="insp-kicker">${esc(t('inspector.family'))}</p>
        <h2><button type="button" class="speak-word" ${speakAttrs(node.form, node.era || eraDefault())}>${esc(node.form)}</button></h2>
        <p class="insp-meta">${esc(node.pos || '')}${node.era ? ' · ' + esc(node.era) : ''}</p>
        <p class="insp-gloss">${esc(node.gloss || '')}</p>
      </div>
      <div data-sheet-pane="word">
        <p class="insp-note">${esc(node.link || '')}</p>
      </div>
      <div data-sheet-pane="morphs">
        <button type="button" class="op-btn op-single" data-op="transmute">
          <span class="op-name">${esc(t('op.transmute'))}</span>
          <span class="op-hint">${esc(t('op.transmuteHint'))}</span>
        </button>
      </div>
    `;
    fillSheetTabs(
      [
        { id: 'word', label: t('sheet.tabWord') },
        { id: 'morphs', label: t('sheet.tabOps') },
      ],
      'word'
    );
  }

  function renderHistory(list, active) {
    const el = document.getElementById('grimoire-list');
    if (!list.length) {
      el.innerHTML = `<p class="rail-empty">${esc(t('rail.emptyGrimoire'))}</p>`;
      return;
    }
    el.innerHTML = list
      .map(
        (row) => `
      <div class="rail-item ${row.normalized === active ? 'is-active' : ''}">
        <button type="button" class="rail-open" data-hist="${esc(row.normalized)}">
          <span class="rail-word">${esc(row.lemma)}</span>
          <span class="rail-gloss">${esc(row.glossZh)}</span>
        </button>
        <button type="button" class="rail-del" data-hist-del="${esc(row.normalized)}" title="${esc(t('rail.deleteItem'))}" aria-label="${esc(t('rail.deleteItem'))}">×</button>
      </div>`
      )
      .join('');
  }

  function renderCabinet(list) {
    const el = document.getElementById('cabinet-list');
    const count = document.getElementById('cabinet-count');
    if (count) count.textContent = String(list.length);
    if (!list.length) {
      el.classList.remove('can-mix');
      el.innerHTML = `<p class="rail-empty">${esc(t('rail.emptyCabinet'))}</p>`;
      return;
    }
    const canMix = el.classList.contains('can-mix');
    el.innerHTML = `<p class="rail-cab-hint">${esc(t('rail.cabinetHint'))}</p>` +
      list
        .map((row) => {
          const meta = VA.schema.kindMeta(row.kind);
          return `
        <div class="rail-item kind-${esc(row.kind)}" data-cab="${esc(row.id)}" title="${esc(t('rail.cabinetItemHint'))}">
          <span class="rail-word">${esc(row.surface)}</span>
          <span class="rail-gloss">${esc(meta.zh)} · ${esc(row.meaningZh)} · ×${row.count || 1}</span>
          <button type="button" class="rail-mix" data-cab-mix="${esc(row.id)}" title="${esc(t('rail.mixHint'))}">${esc(t('op.coniunctioShort'))}</button>
        </div>`;
        })
        .join('');
    el.classList.toggle('can-mix', canMix);
  }

  function setCabinetMixEnabled(on) {
    document.getElementById('cabinet-list')?.classList.toggle('can-mix', Boolean(on));
  }

  function showCabGhost(row, x, y) {
    let el = document.getElementById('cab-ghost');
    if (!el) {
      el = document.createElement('div');
      el.id = 'cab-ghost';
      el.setAttribute('aria-hidden', 'true');
      document.body.appendChild(el);
    }
    const meta = VA.schema.kindMeta(row.kind);
    el.innerHTML = `<span class="rail-word">${esc(row.surface)}</span><span class="rail-gloss">${esc(meta.zh)}</span>`;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.classList.add('show');
  }

  function moveCabGhost(x, y) {
    const el = document.getElementById('cab-ghost');
    if (!el) return;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
  }

  function hideCabGhost() {
    document.getElementById('cab-ghost')?.classList.remove('show');
  }

  function renderExamples() {}

  function setStatus(msg, kind) {
    const el = document.getElementById('status');
    el.textContent = msg || '';
    el.dataset.kind = kind || '';
  }

  function setCasting(on) {
    document.getElementById('stage').classList.toggle('is-casting', on);
    document.getElementById('crucible').classList.toggle('is-hot', on);
    document.getElementById('cast-btn').disabled = on;
    VA.audio?.setCircle?.(on);
  }

  function setIdle(on) {
    document.getElementById('crucible')?.classList.add('hidden');
    document.getElementById('stage').classList.toggle('is-idle', on);
    const hint = document.getElementById('idle-hint');
    if (hint) {
      const p = VA.langs?.current?.() || {};
      hint.textContent = p.crucibleHint || 'Solve et coagula';
      hint.hidden = !on;
    }
    if (on) setSheetOpen(false);
  }

  function toast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove('show'), 1800);
  }

  function fillSettings(settings, apiKey) {
    const provider = settings.provider || 'grok';
    applyProvider(provider, {
      model: settings.model,
      baseUrl: settings.baseUrl,
      apiKey,
    });
    document.getElementById('set-effort').value = settings.reasoningEffort || 'low';
    const clickSpeak = document.getElementById('set-click-speak');
    if (clickSpeak) clickSpeak.checked = settings.clickSpeak !== false;
    const engine = document.getElementById('set-tts-engine');
    if (engine) engine.value = settings.ttsEngine || 'browser';
    const amb = document.getElementById('set-ambient');
    if (amb) amb.checked = settings.ambientOn !== false;
    const sfx = document.getElementById('set-sfx');
    if (sfx) sfx.checked = settings.sfxOn !== false;
    const av = document.getElementById('set-ambient-vol');
    if (av) av.value = String(Math.round((settings.ambientVol == null ? 0.55 : settings.ambientVol) * 100));
    const sv = document.getElementById('set-sfx-vol');
    if (sv) sv.value = String(Math.round((settings.sfxVol == null ? 0.55 : settings.sfxVol) * 100));
    syncVolOutputs();
    applyFontScale(settings.fontScale);
    renderGrimSettings();
  }

  function renderGrimSettings() {
    const el = document.getElementById('grim-lang-list');
    if (!el) return;
    const langs = VA.langs?.list?.() || [];
    let total = 0;
    el.innerHTML = langs
      .map((p) => {
        const n = VA.storage.historyCount(p.id);
        total += n;
        const countLabel = n ? `${n} 則` : t('settings.grimEmpty');
        return `
        <div class="grim-lang-row">
          <div>
            <div class="grim-lang-name">${esc(p.label.zh)} · ${esc(p.label.native)}</div>
            <div class="hint">${esc(countLabel)}</div>
          </div>
          <button type="button" class="icon-btn" data-clear-lang="${esc(p.id)}" ${n ? '' : 'disabled'}>${esc(t('settings.clearLang'))}</button>
        </div>`;
      })
      .join('');
    const all = document.getElementById('clear-all-history');
    if (all) all.disabled = total === 0;
  }

  function syncVolOutputs() {
    const av = document.getElementById('set-ambient-vol');
    const ao = document.getElementById('ambient-vol-value');
    if (av && ao) ao.textContent = `${av.value}%`;
    const sv = document.getElementById('set-sfx-vol');
    const so = document.getElementById('sfx-vol-value');
    if (sv && so) so.textContent = `${sv.value}%`;
  }

  const FONT_BASE = 1.3;

  function clampFontScale(scale) {
    const n = Number(scale);
    if (!Number.isFinite(n)) return 1;
    return Math.min(1.5, Math.max(0.8, Math.round(n * 20) / 20));
  }

  function applyFontScale(scale) {
    const n = clampFontScale(scale);
    document.documentElement.style.setProperty('--fs', String(n * FONT_BASE));
    const slider = document.getElementById('set-font-scale');
    if (slider) slider.value = String(Math.round(n * 100));
    const out = document.getElementById('font-scale-value');
    if (out) out.textContent = `${Math.round(n * 100)}%`;
    document.querySelectorAll('[data-font-preset]').forEach((btn) => {
      const v = Number(btn.getAttribute('data-font-preset'));
      btn.classList.toggle('is-on', Math.abs(v - n) < 0.03);
    });
    return n;
  }

  function updateAmbientBtn(on) {
    const btn = document.getElementById('ambient-btn');
    if (!btn) return;
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.textContent = on ? '爐樂' : '靜音';
    btn.classList.toggle('is-muted', !on);
  }

  function applyProvider(id, { model, baseUrl, apiKey, fillDefaults } = {}) {
    const spec = VA.ai.PROVIDERS[id] || VA.ai.PROVIDERS.grok;
    document.querySelectorAll('#provider-row [data-provider]').forEach((btn) => {
      btn.classList.toggle('is-on', btn.getAttribute('data-provider') === spec.id);
    });
    const hint = document.getElementById('provider-hint');
    if (hint) {
      hint.innerHTML = `${esc(spec.hint)} · <a href="${esc(spec.keyUrl)}" target="_blank" rel="noopener">取得金鑰</a>`;
    }
    const keyEl = document.getElementById('set-key');
    keyEl.placeholder = spec.placeholder;
    if (apiKey != null) keyEl.value = apiKey;
    document.getElementById('set-model').value = fillDefaults ? spec.model : model || spec.model;
    document.getElementById('set-base').value = fillDefaults ? spec.baseUrl : baseUrl || spec.baseUrl;
    const list = document.getElementById('model-presets');
    if (list) {
      list.innerHTML = spec.models.map((m) => `<option value="${esc(m)}"></option>`).join('');
    }
  }

  function selectedProvider() {
    return document.querySelector('#provider-row [data-provider].is-on')?.getAttribute('data-provider') || 'grok';
  }

  let lastSettingsTab = 'api';

  function showSettingsTab(id) {
    const tab = String(id || lastSettingsTab || 'api');
    lastSettingsTab = tab;
    const list = document.getElementById('settings-tabs');
    if (list) {
      const vertical = window.matchMedia('(min-width: 821px)').matches;
      list.setAttribute('aria-orientation', vertical ? 'vertical' : 'horizontal');
    }
    document.querySelectorAll('#settings-tabs [data-set-tab]').forEach((btn) => {
      const on = btn.getAttribute('data-set-tab') === tab;
      btn.classList.toggle('is-on', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
      btn.tabIndex = on ? 0 : -1;
    });
    document.querySelectorAll('.settings-pane').forEach((pane) => {
      const on = pane.getAttribute('data-set-pane') === tab;
      pane.classList.toggle('hidden', !on);
      pane.hidden = !on;
    });
  }

  function openSettings(on, tab) {
    const overlay = document.getElementById('settings-overlay');
    overlay.classList.toggle('hidden', !on);
    if (on) {
      showSettingsTab(tab || lastSettingsTab || 'api');
      requestAnimationFrame(() => {
        document.querySelector('#settings-tabs [data-set-tab].is-on')?.focus();
      });
    }
  }

  VA.ui = {
    renderNode,
    renderInspector,
    renderGuide,
    renderHistory,
    renderCabinet,
    setCabinetMixEnabled,
    showCabGhost,
    moveCabGhost,
    hideCabGhost,
    renderExamples,
    setStatus,
    setCasting,
    setIdle,
    toast,
    fillSettings,
    renderGrimSettings,
    FONT_BASE,
    applyFontScale,
    clampFontScale,
    updateAmbientBtn,
    applyProvider,
    selectedProvider,
    showSettingsTab,
    openSettings,
    syncVolOutputs,
    setSheetOpen,
    showSheetTab,
    fillSheetTabs,
    setRailOpen,
    esc,
  };
})(typeof window !== 'undefined' ? window : globalThis);

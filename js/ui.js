/**
 * Verba Orbis UI renderers (file:// safe)
 */
(function (global) {
  const VO = (global.VerbaOrbis = global.VerbaOrbis || {});

  function t(key) {
    return VO.i18n.t(key);
  }

  function esc(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function setStatus(el, message, kind) {
    if (!el) return;
    el.className = 'status-bar' + (kind ? ` ${kind}` : '');
    el.textContent = message || '';
  }

  function setLoading(el, loading, message) {
    if (!el) return;
    el.className = 'status-bar';
    el.textContent = '';
    if (loading) {
      const spin = document.createElement('span');
      spin.className = 'spinner';
      el.appendChild(spin);
      el.appendChild(document.createTextNode(message || t('status.listing')));
    } else if (message) {
      el.textContent = message;
    }
  }

  const CHIP_LANGS = [
    { id: 'auto', labelKey: 'lang.auto' },
    { id: 'zh', labelKey: 'lang.zh' },
    { id: 'ko', labelKey: 'lang.ko' },
    { id: 'ja', labelKey: 'lang.ja' },
    { id: 'en', labelKey: 'lang.en' },
    { id: 'de', labelKey: 'lang.de' },
    { id: 'es', labelKey: 'lang.es' },
    { id: 'fr', labelKey: 'lang.fr' },
    { id: 'it', labelKey: 'lang.it' },
    { id: 'la', labelKey: 'lang.la' },
  ];

  const CHIP_ROWS = [
    { cls: 'chip-row-cjk', ids: ['auto', 'zh', 'ko', 'ja'] },
    { cls: 'chip-row-eu', ids: ['en', 'de', 'es', 'fr', 'it', 'la'] },
  ];

  function renderLangChips(el, { selected, onSelect }) {
    if (!el) return;
    const byId = {};
    CHIP_LANGS.forEach((c) => {
      byId[c.id] = c;
    });
    el.innerHTML = `<div class="chip-board">${CHIP_ROWS.map((row) => {
      return `<div class="chip-row ${row.cls}">${row.ids
        .map((id) => {
          const c = byId[id];
          if (!c) return '';
          const active = selected === id ? ' active' : '';
          const kind = id === 'auto' ? ' chip-auto' : '';
          return `<button type="button" class="chip${kind}${active}" data-lang="${esc(id)}">${esc(t(c.labelKey))}</button>`;
        })
        .join('')}</div>`;
    }).join('')}</div>`;
    el.querySelectorAll('[data-lang]').forEach((btn) => {
      btn.addEventListener('click', () => onSelect && onSelect(btn.getAttribute('data-lang')));
    });
  }

  function posLabel(pos) {
    return String(pos || '');
  }

  function renderSensePicker(el, candidates, { onPick, highlightKey, single } = {}) {
    if (!el) return;
    const list = Array.isArray(candidates) ? candidates : [];
    if (!list.length) {
      el.innerHTML = '';
      return;
    }
    const btnLabel = single || list.length === 1 ? t('picker.confirmOne') : t('picker.confirm');
    el.innerHTML = `
      <div class="picker-head">${esc(t('picker.title'))}</div>
      <div class="picker-grid">
        ${list
          .map((c, i) => {
            const hi = highlightKey && c.senseKey === highlightKey ? ' highlight' : '';
            return `<article class="sense-card${hi}" data-idx="${i}" tabindex="0">
              <div class="sense-meta">${esc(c.id || 's' + (i + 1))} · ${esc(posLabel(c.pos))} · ${esc(c.domain || '')}</div>
              <div class="sense-gloss">${esc(c.glossZh)}</div>
              ${c.note ? `<div class="sense-note">${esc(c.note)}</div>` : ''}
              <button type="button" class="btn-primary sense-pick" data-idx="${i}">${esc(btnLabel)}</button>
            </article>`;
          })
          .join('')}
      </div>`;
    el.querySelectorAll('.sense-pick').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = Number(btn.getAttribute('data-idx'));
        onPick && onPick(list[idx]);
      });
    });
    el.querySelectorAll('.sense-card').forEach((card) => {
      card.addEventListener('click', () => {
        const idx = Number(card.getAttribute('data-idx'));
        onPick && onPick(list[idx]);
      });
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const idx = Number(card.getAttribute('data-idx'));
          onPick && onPick(list[idx]);
        }
      });
    });
  }

  function renderLockedChip(el, sense, { onChange, onRecompare } = {}) {
    if (!el) return;
    if (!sense) {
      el.innerHTML = '';
      return;
    }
    el.innerHTML = `
      <div class="lock-chip">
        <div class="lock-copy">
          <span class="lock-kicker">${esc(t('lock.locked'))}${sense.pos ? ` · ${esc(sense.pos)}` : ''}</span>
          <span class="lock-gloss">${esc(sense.glossZh || '')}</span>
        </div>
        <div class="lock-actions">
          <button type="button" class="btn-ghost" id="btn-change-sense">${esc(t('lock.change'))}</button>
          <button type="button" class="btn-ghost" id="btn-recompare">${esc(t('lock.recompare'))}</button>
        </div>
      </div>`;
    el.querySelector('#btn-change-sense')?.addEventListener('click', () => onChange && onChange());
    el.querySelector('#btn-recompare')?.addEventListener('click', () => onRecompare && onRecompare());
  }

  function sinoLabel(card) {
    if (card.lang === 'ko' && card.sinoClass) {
      return { hanja: '한자어', native: '고유어', loan: '외래어', mixed: '혼합' }[card.sinoClass] || card.sinoClass;
    }
    if (card.lang === 'ja' && card.jpClass) {
      const cls = { kango: '漢語', wago: '和語', gairaigo: '外来語', mixed: '混合' }[card.jpClass] || card.jpClass;
      const rd = { on: '音讀', kun: '訓讀', mixed: '音訓', na: '' }[card.jpReadingType] || '';
      return rd ? `${cls} · ${rd}` : cls;
    }
    return '';
  }

  function genderNote(p) {
    if (!p) return '';
    const bits = [];
    if (p.gender) bits.push(p.gender);
    if (p.plural) bits.push('pl. ' + p.plural);
    return bits.join(' · ');
  }

  function firstSentence(s, max) {
    const text = String(s || '').trim();
    if (!text) return '';
    const m = text.match(/^[\s\S]{1,90}?[。！？.!?]/);
    let cut = (m ? m[0] : text).trim();
    const cap = max || 72;
    if (cut.length > cap) cut = cut.slice(0, cap) + '…';
    return cut;
  }

  function isBlankHeadword(s) {
    const text = String(s || '').trim();
    return !text || /^[—–−\-]+$/.test(text);
  }

  function displayHeadword(card) {
    const p = (card && card.primary) || {};
    if (!isBlankHeadword(p.headword)) return p.headword;
    const alt = (card.alternatives || []).find((a) => a && !isBlankHeadword(a.headword));
    if (alt) return alt.headword;
    if (!isBlankHeadword(p.plural)) return p.plural;
    return '';
  }

  function isExactEquiv(code) {
    return String(code || '') === 'exact';
  }

  function toriiSvg(extraClass) {
    return `<svg class="${extraClass || 'lang-mark'}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M1.2 6.15 3.45 4.2h17.1L22.8 6.15v1.4H1.2V6.15z"/>
      <rect x="3.35" y="7.7" width="17.3" height="1.15" rx="0.2"/>
      <rect x="6.2" y="7.7" width="2.05" height="13.5" rx="0.25"/>
      <rect x="15.75" y="7.7" width="2.05" height="13.5" rx="0.25"/>
      <rect x="5.15" y="13.2" width="13.7" height="1.4" rx="0.2"/>
    </svg>`;
  }

  function langMark(lang) {
    if (lang === 'ja') return toriiSvg('lang-mark');
    return '';
  }

  function renderLangCard(card, { radixUrl } = {}) {
    if (!card) return '';
    const p = card.primary || {};
    const cls = sinoLabel(card);
    const href = radixUrl || '';
    const hanja = p.hanja ? `<span class="hanja">${esc(p.hanja)}</span>` : '';
    const euIpaLangs = { en: 1, de: 1, es: 1, fr: 1, it: 1 };
    const rawIpa = String(p.ipa || (euIpaLangs[card.lang] ? p.reading : '') || '')
      .trim()
      .replace(/^\/+|\/+$/g, '');
    const readingText = euIpaLangs[card.lang] ? rawIpa : String(p.reading || '').trim();
    const reading = readingText ? `<div class="card-reading">/${esc(readingText)}/</div>` : '';
    const extraBits = [
      ...(cls ? cls.split(' · ').filter(Boolean) : []),
      p.pos,
      p.register && p.register !== '中性' ? p.register : '',
      p.gender,
      p.plural ? 'pl. ' + p.plural : '',
    ].filter(Boolean);
    const extraPills = extraBits
      .map((bit) => `<span class="meta-pill">${esc(bit)}</span>`)
      .join('');
    const row = (label, body) =>
      body ? `<div class="card-row"><span class="k">${esc(label)}</span><div class="v">${body}</div></div>` : '';
    const radixBtn = href
      ? `<a class="radix-link" href="${esc(href)}" target="_blank" rel="noopener">${esc(t('card.radix'))}</a>`
      : '';
    const gloss = String((p && p.glossZh) || '').trim();
    const equivNote =
      !isExactEquiv(card.equiv) && card.caveatsZh ? String(card.caveatsZh).trim() : '';
    const etym = String(card.etymologyZh || '').trim();
    const hub = card.lang === 'la' ? ' hub' : '';
    const hw = displayHeadword(card);
    const langName = t('langFull.' + card.lang);
    const speakBtn =
      card.lang !== 'la' && hw && !isBlankHeadword(hw)
        ? `<button type="button" class="speak-btn" data-action="speak" data-word="${esc(hw)}" data-lang="${esc(card.lang || '')}" title="${esc(t('card.speak'))}" aria-label="${esc(t('card.speak'))}"><span class="speak-icon" aria-hidden="true"></span><span class="speak-label">${esc(t('card.speak'))}</span></button>`
        : '';
    const frontLabel = `${hw || t('card.noHeadword')}，${langName}。${t('card.flipHint')}`;
    const mark = langMark(card.lang);
    return `<article class="lang-card lang-${esc(card.lang || '')}${hub}" data-lang="${esc(card.lang || '')}" tabindex="0" aria-expanded="false" aria-label="${esc(frontLabel)}">
      <div class="card-flip">
        <div class="card-face card-front">
          <div class="card-front-top">
            <span class="lang-kicker">${mark}<span class="lang-name">${esc(langName)}</span></span>
            ${speakBtn}
          </div>
          <div class="card-front-inner">
            <div class="card-front-word">
              <span class="hw">${esc(hw || t('card.noHeadword'))}</span>
              ${hanja}
            </div>
            ${reading}
            ${extraPills ? `<div class="card-front-meta">${extraPills}</div>` : ''}
          </div>
        </div>
        <div class="card-face card-back">
          <div class="card-back-inner">
            <span class="lang-name">${esc(langName)}</span>
            ${row(t('card.core'), gloss ? esc(gloss) : '')}
            ${row(t('card.caveat'), equivNote ? esc(equivNote) : '')}
            ${row(t('card.etym'), etym ? esc(etym) : '')}
            ${radixBtn ? `<div class="card-foot">${radixBtn}</div>` : ''}
          </div>
        </div>
      </div>
    </article>`;
  }

  function isFlippableCard(card) {
    return !!(
      card &&
      card.classList.contains('lang-card') &&
      !card.classList.contains('empty-slot') &&
      !card.classList.contains('skeleton')
    );
  }

  function toggleCardFlip(card, force) {
    if (!isFlippableCard(card)) return;
    const next = typeof force === 'boolean' ? force : !card.classList.contains('is-flipped');
    const board = card.closest('.board') || card.closest('.board-pane') || document;
    board.querySelectorAll('.lang-card.is-flipped').forEach((el) => {
      if (el !== card) {
        el.classList.remove('is-flipped');
        el.setAttribute('aria-expanded', 'false');
      }
    });
    card.classList.toggle('is-flipped', next);
    card.setAttribute('aria-expanded', next ? 'true' : 'false');
  }

  function renderCognateNet(net) {
    if (!net) return '';
    const pills = (arr) =>
      (arr || []).map((x) => `<span class="net-pill">${esc(x)}</span>`).join('');
    const traps = (net.traps || [])
      .map((tr) => `<li><strong>${esc(tr.form)}</strong> — ${esc(tr.noteZh)}</li>`)
      .join('');
    const lead = firstSentence(net.summaryZh, 90);
    const hasMore = !!(traps || (net.summaryZh && net.summaryZh.length > (lead || '').length + 8));
    return `<div class="zone-essay">
      <h3>${esc(t('zone.cognates'))}</h3>
      <div class="net-row"><span class="k">日耳曼</span>${pills(net.germanic)}</div>
      <div class="net-row"><span class="k">羅曼</span>${pills(net.romance)}</div>
      ${lead ? `<p class="essay-lead">${esc(lead)}</p>` : ''}
      ${
        hasMore
          ? `<details class="essay-more"><summary>${esc(t('zone.expandEssay'))}</summary>${
              traps ? `<ul class="ff-list">${traps}</ul>` : ''
            }${net.summaryZh ? `<p>${esc(net.summaryZh)}</p>` : ''}</details>`
          : ''
      }
    </div>`;
  }

  function attachCardLinks(el, cards) {
    if (!el || !VO.storage) return;
    el.querySelectorAll('.lang-card').forEach((node, i) => {
      /* links already baked if href present */
    });
  }

  function cardsInBoardOrder(cards, order) {
    const byLang = {};
    (cards || []).forEach((c) => {
      if (c && c.lang) byLang[c.lang] = c;
    });
    return order.map((lang) => byLang[lang] || { lang, equiv: 'gap', primary: { headword: '' } });
  }

  function renderCardList(cards) {
    return cards
      .map((c) =>
        renderLangCard(c, { radixUrl: VO.storage.radixHref(c.lang, c.primary && c.primary.headword) })
      )
      .join('');
  }

  function emptySlot(lang) {
    return `<article class="lang-card empty-slot lang-${esc(lang)}" data-lang="${esc(lang)}">
      <span class="lang-name">${esc(t('langFull.' + lang))}</span>
    </article>`;
  }

  const DEFAULT_CARD_BG = {
    zh: 'img/bg-zh.jpg',
    ko: 'img/bg-ko.jpg',
    ja: 'img/bg-ja.jpg',
    en: 'img/bg-en.jpg',
    de: 'img/bg-de.jpg',
    es: 'img/bg-es.jpg',
    fr: 'img/bg-fr.jpg',
    it: 'img/bg-it.jpg',
    la: 'img/bg-la.jpg',
  };

  function applyCardBackgrounds(root) {
    const scope = root || document;
    const store = VO.storage;
    const custom = store && store.getCardBgs ? store.getCardBgs() : {};
    scope.querySelectorAll('.lang-card[data-lang]').forEach((card) => {
      const lang = card.getAttribute('data-lang');
      const uploaded = custom[lang];
      const fallback = DEFAULT_CARD_BG[lang];
      const url =
        typeof uploaded === 'string' && uploaded.indexOf('data:image/') === 0
          ? uploaded
          : fallback
            ? fallback
            : '';
      if (url) {
        card.classList.add('has-custom-bg');
        card.style.setProperty('--card-bg', 'url("' + String(url).replace(/"/g, '\\"') + '")');
      } else {
        card.classList.remove('has-custom-bg');
        card.style.removeProperty('--card-bg');
      }
    });
  }

  function zoneLabel(key) {
    return `<div class="zone-label">${esc(t(key))}</div>`;
  }

  function renderZoneA(el, zoneA) {
    if (!el) return;
    if (!zoneA) {
      el.innerHTML = '';
      return;
    }
    const order = (VO.schema && VO.schema.BOARD_CJK) || ['ko', 'zh', 'ja'];
    const cards = cardsInBoardOrder(zoneA.cards, order);
    const html = cards
      .map((c) =>
        c && c.primary && (c.primary.headword || c.primary.glossZh)
          ? renderLangCard(c, { radixUrl: VO.storage.radixHref(c.lang, c.primary && c.primary.headword) })
          : emptySlot(c.lang)
      )
      .join('');
    el.innerHTML = `${zoneLabel('zone.a')}<div class="card-grid board-cjk">${html}</div>`;
    applyCardBackgrounds(el);
  }

  function renderZoneB(el, zoneB, { failed, onRetry } = {}) {
    if (!el) return;
    if (!zoneB && !failed) {
      el.innerHTML = '';
      return;
    }
    const order = (VO.schema && VO.schema.BOARD_EU) || ['es', 'la', 'de', 'it', 'fr', 'en'];
    const cards = zoneB ? cardsInBoardOrder(zoneB.cards, order) : order.map((lang) => ({ lang }));
    const html = cards
      .map((c) =>
        c && c.primary && (c.primary.headword || c.primary.glossZh)
          ? renderLangCard(c, { radixUrl: VO.storage.radixHref(c.lang, c.primary && c.primary.headword) })
          : emptySlot(c.lang)
      )
      .join('');
    const retry = failed
      ? `<button type="button" class="btn-ghost retry-b" id="btn-retry-b">${esc(t('zone.retryB'))}</button>`
      : '';
    el.innerHTML = `${retry}${zoneLabel('zone.b')}<div class="card-grid board-eu">${html}</div>`;
    el.querySelector('#btn-retry-b')?.addEventListener('click', () => onRetry && onRetry());
    applyCardBackgrounds(el);
  }

  function renderZoneSkeleton(el, zone) {
    if (!el) return;
    const order =
      zone === 'A'
        ? (VO.schema && VO.schema.BOARD_CJK) || ['ko', 'zh', 'ja']
        : (VO.schema && VO.schema.BOARD_EU) || ['es', 'la', 'de', 'it', 'fr', 'en'];
    const grid = zone === 'A' ? 'board-cjk' : 'board-eu';
    const label = zone === 'A' ? 'zone.a' : 'zone.b';
    el.innerHTML = `${zoneLabel(label)}<div class="card-grid ${grid}">
      ${order
        .map(
          (lang) =>
            `<article class="lang-card skeleton lang-${esc(lang)}" data-lang="${esc(lang)}"><span class="lang-name">${esc(t('langFull.' + lang))}</span><p class="sk-caption">撰寫中…</p></article>`
        )
        .join('')}
    </div>`;
    applyCardBackgrounds(el);
  }

  function renderHistory(el, records, { onSelect, onDelete, activeId } = {}) {
    if (!el) return;
    const list = Array.isArray(records) ? records : [];
    if (!list.length) {
      el.innerHTML = `<div class="history-empty">${esc(t('history.empty'))}</div>`;
      return;
    }
    el.innerHTML = list
      .map((r) => {
        const active = r.id === activeId ? ' active' : '';
        return `<div class="history-item${active}" data-id="${esc(r.id)}">
          <button type="button" class="history-select">
            <span class="hi-q">${esc(r.query || r.normalized || '')}</span>
            <span class="hi-g">${esc(r.senseGloss || '')}</span>
          </button>
          <button type="button" class="history-delete" data-id="${esc(r.id)}" title="${esc(t('history.delete'))}" aria-label="${esc(t('history.delete'))}">×</button>
        </div>`;
      })
      .join('');
    el.querySelectorAll('.history-select').forEach((btn) => {
      btn.addEventListener('click', () => {
        const rec = list.find((r) => r.id === btn.closest('.history-item')?.getAttribute('data-id'));
        onSelect && onSelect(rec);
      });
    });
    el.querySelectorAll('.history-delete').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const rec = list.find((r) => r.id === btn.getAttribute('data-id'));
        onDelete && onDelete(rec);
      });
    });
  }

  function setSpeakBtnState(btn, state) {
    if (!btn) return;
    btn.classList.remove('speaking', 'loading');
    btn.disabled = false;
    const label = btn.querySelector('.speak-label');
    if (state === 'loading') {
      btn.classList.add('loading');
      btn.disabled = true;
      btn.setAttribute('aria-busy', 'true');
      if (label) label.textContent = t('status.speakLoading');
    } else if (state === 'speaking') {
      btn.classList.add('speaking');
      btn.setAttribute('aria-busy', 'false');
      if (label) label.textContent = t('card.speak');
    } else {
      btn.setAttribute('aria-busy', 'false');
      if (label) label.textContent = t('card.speak');
    }
  }

  VO.ui = {
    esc,
    setStatus,
    setLoading,
    setSpeakBtnState,
    isFlippableCard,
    toggleCardFlip,
    renderLangChips,
    renderSensePicker,
    renderLockedChip,
    renderZoneA,
    renderZoneB,
    renderZoneSkeleton,
    applyCardBackgrounds,
    renderHistory,
    CHIP_LANGS,
  };
})(typeof window !== 'undefined' ? window : globalThis);

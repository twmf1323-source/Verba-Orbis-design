/**
 * Card background cropper (file:// safe)
 */
(function (global) {
  const VO = (global.VerbaOrbis = global.VerbaOrbis || {});

  function t(key) {
    return VO.i18n.t(key);
  }

  const MIN_BOX = 56;
  const MAX_OUT = 1400;
  const MAX_DATA = 280000;

  let els = {};
  let state = null;
  let drag = null;

  function cache() {
    els.modal = document.getElementById('crop-modal');
    els.title = document.getElementById('crop-title');
    els.hint = document.getElementById('crop-hint');
    els.stage = document.getElementById('crop-stage');
    els.img = document.getElementById('crop-image');
    els.box = document.getElementById('crop-box');
    els.apply = document.getElementById('crop-apply');
    els.cancel = document.getElementById('crop-cancel');
    els.clear = document.getElementById('crop-clear');
  }

  function isOpen() {
    return !!(els.modal && !els.modal.classList.contains('hidden'));
  }

  function layoutImage() {
    if (!state || !els.img.naturalWidth) return;
    const sw = els.stage.clientWidth;
    const sh = els.stage.clientHeight;
    const iw = els.img.naturalWidth;
    const ih = els.img.naturalHeight;
    const scale = Math.min(sw / iw, sh / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    const left = (sw - dw) / 2;
    const top = (sh - dh) / 2;
    els.img.style.width = dw + 'px';
    els.img.style.height = dh + 'px';
    els.img.style.left = left + 'px';
    els.img.style.top = top + 'px';
    state.layout = { scale, left, top, dw, dh, iw, ih };
  }

  function fitBox() {
    const L = state.layout;
    if (!L) return;
    const aspect = state.aspect || L.dw / L.dh;
    let w = L.dw;
    let h = w / aspect;
    if (h > L.dh) {
      h = L.dh;
      w = h * aspect;
    }
    state.box = {
      x: L.left + (L.dw - w) / 2,
      y: L.top + (L.dh - h) / 2,
      w,
      h,
    };
    paintBox();
  }

  function paintBox() {
    const b = state && state.box;
    if (!b || !els.box) return;
    els.box.hidden = false;
    els.box.style.left = b.x + 'px';
    els.box.style.top = b.y + 'px';
    els.box.style.width = b.w + 'px';
    els.box.style.height = b.h + 'px';
  }

  function clampBox(next) {
    const L = state.layout;
    const aspect = state.aspect || next.w / next.h;
    let { x, y, w, h } = next;
    w = Math.max(MIN_BOX, w);
    h = w / aspect;
    if (h < MIN_BOX) {
      h = MIN_BOX;
      w = h * aspect;
    }
    if (w > L.dw) {
      w = L.dw;
      h = w / aspect;
    }
    if (h > L.dh) {
      h = L.dh;
      w = h * aspect;
    }
    x = Math.min(Math.max(x, L.left), L.left + L.dw - w);
    y = Math.min(Math.max(y, L.top), L.top + L.dh - h);
    return { x, y, w, h };
  }

  function boxFromPoint(cx, cy, handle) {
    const b = state.box;
    if (handle === 'move') {
      return clampBox({ x: cx - drag.ox, y: cy - drag.oy, w: b.w, h: b.h });
    }
    const a = drag.anchor;
    const aspect = state.aspect;
    let w = Math.max(MIN_BOX, Math.abs(cx - a.x));
    let h = w / aspect;
    if (h < MIN_BOX) {
      h = MIN_BOX;
      w = h * aspect;
    }
    let x = a.x;
    let y = a.y;
    if (handle === 'nw' || handle === 'sw') x = a.x - w;
    if (handle === 'nw' || handle === 'ne') y = a.y - h;
    return clampBox({ x, y, w, h });
  }

  function onPointerDown(e) {
    if (!state || !state.layout) return;
    const handle = e.target.getAttribute('data-handle');
    const onBox = e.target === els.box || handle;
    if (!onBox) return;
    e.preventDefault();
    const rect = els.stage.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const b = state.box;
    if (handle) {
      const anchor = {
        nw: { x: b.x + b.w, y: b.y + b.h },
        ne: { x: b.x, y: b.y + b.h },
        sw: { x: b.x + b.w, y: b.y },
        se: { x: b.x, y: b.y },
      }[handle];
      drag = { kind: handle, anchor };
    } else {
      drag = { kind: 'move', ox: cx - b.x, oy: cy - b.y };
    }
    els.box.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e) {
    if (!drag || !state) return;
    const rect = els.stage.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    state.box = boxFromPoint(cx, cy, drag.kind);
    paintBox();
  }

  function onPointerUp() {
    drag = null;
  }

  function onWheel(e) {
    if (!state || !state.box) return;
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.06 : 0.94;
    const b = state.box;
    const cx = b.x + b.w / 2;
    const cy = b.y + b.h / 2;
    const w = b.w * factor;
    const h = b.h * factor;
    state.box = clampBox({ x: cx - w / 2, y: cy - h / 2, w, h });
    paintBox();
  }

  function encodeCanvas(canvas) {
    let q = 0.84;
    let url = canvas.toDataURL('image/jpeg', q);
    while (url.length > MAX_DATA && q > 0.48) {
      q -= 0.08;
      url = canvas.toDataURL('image/jpeg', q);
    }
    return url;
  }

  function exportCrop() {
    const L = state.layout;
    const b = state.box;
    const sx = (b.x - L.left) / L.scale;
    const sy = (b.y - L.top) / L.scale;
    const sw = b.w / L.scale;
    const sh = b.h / L.scale;
    const outW = Math.max(2, Math.round(Math.min(MAX_OUT, sw)));
    const outH = Math.max(2, Math.round(outW / (sw / sh)));
    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#f6f1ea';
    ctx.fillRect(0, 0, outW, outH);
    ctx.drawImage(els.img, sx, sy, sw, sh, 0, 0, outW, outH);
    return encodeCanvas(canvas);
  }

  function close() {
    if (state && state.objectUrl) URL.revokeObjectURL(state.objectUrl);
    state = null;
    drag = null;
    if (els.img) {
      els.img.removeAttribute('src');
    }
    if (els.box) els.box.hidden = true;
    if (els.modal) els.modal.classList.add('hidden');
    document.body.classList.remove('modal-open');
  }

  function open({ file, lang, aspect, langLabel, onApply, onClear }) {
    cache();
    if (!els.modal || !file) return;
    close();
    const objectUrl = URL.createObjectURL(file);
    state = {
      lang,
      aspect: aspect > 0.2 && aspect < 5 ? aspect : 1.2,
      objectUrl,
      onApply,
      onClear,
      box: null,
      layout: null,
    };
    if (els.title) {
      els.title.textContent = `${t('crop.title')} · ${langLabel || lang}`;
    }
    els.modal.classList.remove('hidden');
    document.body.classList.add('modal-open');
    els.img.onload = () => {
      requestAnimationFrame(() => {
        layoutImage();
        fitBox();
      });
    };
    els.img.src = objectUrl;
  }

  function bind() {
    cache();
    if (!els.modal || els.modal.dataset.bound) return;
    els.modal.dataset.bound = '1';
    els.box.addEventListener('pointerdown', onPointerDown);
    els.box.addEventListener('pointermove', onPointerMove);
    els.box.addEventListener('pointerup', onPointerUp);
    els.box.addEventListener('pointercancel', onPointerUp);
    els.stage.addEventListener('wheel', onWheel, { passive: false });
    els.apply.addEventListener('click', () => {
      if (!state || !state.box) return;
      const dataUrl = exportCrop();
      const cb = state.onApply;
      const lang = state.lang;
      close();
      cb && cb(lang, dataUrl);
    });
    els.cancel.addEventListener('click', close);
    els.clear.addEventListener('click', () => {
      const cb = state && state.onClear;
      const lang = state && state.lang;
      close();
      cb && cb(lang);
    });
    els.modal.addEventListener('click', (e) => {
      if (e.target === els.modal) close();
    });
    window.addEventListener('resize', () => {
      if (!isOpen() || !state) return;
      const prev = state.box && state.layout
        ? {
            nx: (state.box.x - state.layout.left) / state.layout.dw,
            ny: (state.box.y - state.layout.top) / state.layout.dh,
            nw: state.box.w / state.layout.dw,
            nh: state.box.h / state.layout.dh,
          }
        : null;
      layoutImage();
      if (prev && state.layout) {
        state.box = clampBox({
          x: state.layout.left + prev.nx * state.layout.dw,
          y: state.layout.top + prev.ny * state.layout.dh,
          w: prev.nw * state.layout.dw,
          h: prev.nh * state.layout.dh,
        });
        paintBox();
      } else {
        fitBox();
      }
    });
  }

  VO.crop = { open, close, isOpen, bind };
})(typeof window !== 'undefined' ? window : globalThis);

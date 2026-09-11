(function (global) {
  const VA = (global.VerbaAthanor = global.VerbaAthanor || {});

  function create({ stage, world, linksSvg, nodesEl, onSelect, onActivate, onMix, renderNode }) {
    const nodes = [];
    const links = [];
    const byId = new Map();
    let cam = { x: 2000, y: 2000, k: 1 };
    let dragging = null;
    let panning = null;
    let selectedId = null;
    let raf = 0;

    function stageRect() {
      return stage.getBoundingClientRect();
    }

    function inspectPad() {
      const box = document.getElementById('inspector');
      if (!box || box.classList.contains('hidden') || box.classList.contains('is-guide')) return 0;
      const ir = box.getBoundingClientRect();
      const sr = stageRect();
      if (ir.height < 8) return 0;
      if (ir.top > sr.top + sr.height * 0.35) return 0;
      const overlap = Math.min(sr.right, ir.right) - Math.max(sr.left, ir.left);
      return overlap > 24 ? overlap + 12 : 0;
    }

    function circleAnchor() {
      const art = stage.querySelector('.circle-art');
      const sr = stageRect();
      if (art) {
        const cr = art.getBoundingClientRect();
        if (cr.width > 40) {
          return {
            cx: cr.left - sr.left + cr.width / 2,
            cy: cr.top - sr.top + cr.height / 2,
            r: cr.width / 2,
          };
        }
      }
      const pad = inspectPad();
      return {
        cx: Math.max(80, sr.width - pad) / 2,
        cy: sr.height * 0.46,
        r: Math.min(360, (sr.width - pad) * 0.36),
      };
    }

    function viewCenter() {
      const c = circleAnchor();
      return { cx: c.cx, cy: c.cy };
    }

    function wordNode() {
      return nodes.find((n) => n.type === 'word') || null;
    }

    function applyCam() {
      const c = viewCenter();
      const tx = c.cx - cam.x * cam.k;
      const ty = c.cy - cam.y * cam.k;
      world.style.transform = `translate(${tx}px, ${ty}px) scale(${cam.k})`;
    }

    function toWorld(clientX, clientY) {
      const r = stageRect();
      const c = viewCenter();
      return {
        x: cam.x + (clientX - r.left - c.cx) / cam.k,
        y: cam.y + (clientY - r.top - c.cy) / cam.k,
      };
    }

    function addNode(node) {
      if (byId.has(node.id)) return byId.get(node.id);
      const n = {
        vx: 0,
        vy: 0,
        r: node.r || (node.type === 'word' ? 90 : node.type === 'morph' ? 56 : 70),
        pinned: Boolean(node.pinned),
        born: performance.now(),
        ...node,
      };
      if (n.x == null) n.x = cam.x + (Math.random() - 0.5) * 40;
      if (n.y == null) n.y = cam.y + (Math.random() - 0.5) * 40;
      nodes.push(n);
      byId.set(n.id, n);
      const el = renderNode(n);
      el.dataset.id = n.id;
      el.classList.add('node', `node-${n.type}`);
      if (n.kind) el.classList.add(`kind-${n.kind}`);
      if (n.fromCabinet) el.classList.add('from-cabinet');
      el.style.left = `${n.x}px`;
      el.style.top = `${n.y}px`;
      el.addEventListener('pointerdown', (ev) => {
        ev.stopPropagation();
        ev.preventDefault();
        select(n.id);
        if (n.type === 'word' && n.pinned) {
          panning = { x: ev.clientX, y: ev.clientY, cx: cam.x, cy: cam.y };
          dragging = { id: n.id, x: ev.clientX, y: ev.clientY, moved: false, lock: true };
          stage.classList.add('is-panning');
          return;
        }
        el.setPointerCapture(ev.pointerId);
        dragging = { id: n.id, x: ev.clientX, y: ev.clientY, moved: false };
      });
      nodesEl.appendChild(el);
      n.el = el;
      return n;
    }

    function addLink(a, b, kind) {
      const id = `${a}~${b}~${kind}`;
      if (links.some((l) => l.id === id)) return;
      links.push({ id, a, b, kind, born: performance.now() });
    }

    function select(id) {
      selectedId = id;
      nodes.forEach((n) => n.el.classList.toggle('is-selected', n.id === id));
      const n = byId.get(id);
      if (n) onSelect?.(n);
    }

    function get(id) {
      return byId.get(id);
    }

    function hitAt(clientX, clientY, { excludeId } = {}) {
      const w = toWorld(clientX, clientY);
      let best = null;
      let bestD = Infinity;
      for (const n of nodes) {
        if (n.id === excludeId) continue;
        const d = Math.hypot(n.x - w.x, n.y - w.y);
        if (d <= (n.r || 58) + 28 && d < bestD) {
          best = n;
          bestD = d;
        }
      }
      return best;
    }

    function setDropTarget(id) {
      nodes.forEach((n) => n.el.classList.toggle('is-drop-target', Boolean(id) && n.id === id));
    }

    function all() {
      return nodes;
    }

    function clear() {
      nodes.length = 0;
      links.length = 0;
      byId.clear();
      selectedId = null;
      nodesEl.innerHTML = '';
      linksSvg.innerHTML = '';
      cam = { x: 2000, y: 2000, k: 1 };
      applyCam();
    }

    function snapshot() {
      return {
        cam: { x: cam.x, y: cam.y, k: cam.k },
        selectedId,
        nodes: nodes.map((n) => ({
          id: n.id,
          type: n.type,
          form: n.form,
          ipa: n.ipa,
          pos: n.pos,
          analysis: n.analysis,
          gloss: n.gloss,
          kind: n.kind,
          morph: n.morph,
          era: n.era,
          rel: n.rel,
          link: n.link,
          fromCabinet: n.fromCabinet,
          pinned: n.pinned,
          x: n.x,
          y: n.y,
          r: n.r,
          tx: n.tx,
          ty: n.ty,
        })),
        links: links.map((l) => ({ a: l.a, b: l.b, kind: l.kind })),
      };
    }

    function restore(state) {
      clear();
      if (!state?.nodes?.length) return;
      cam = {
        x: state.cam?.x ?? 2000,
        y: state.cam?.y ?? 2000,
        k: state.cam?.k ?? 1,
      };
      for (const n of state.nodes) addNode({ ...n });
      for (const l of state.links || []) addLink(l.a, l.b, l.kind);
      if (state.selectedId && byId.has(state.selectedId)) {
        selectedId = state.selectedId;
        nodes.forEach((n) => n.el.classList.toggle('is-selected', n.id === selectedId));
      }
      applyCam();
    }

    function fit() {
      focusWord();
    }

    function focusWord({ includeOuter } = {}) {
      const word = wordNode();
      cam.x = word ? word.x : 2000;
      cam.y = word ? word.y : 2000;
      const c = circleAnchor();
      let reach = word ? word.r + 36 : 140;
      if (word) {
        nodes.forEach((n) => {
          if (n.type === 'word') return;
          if (!includeOuter && n.type !== 'morph') return;
          reach = Math.max(reach, Math.hypot(n.x - word.x, n.y - word.y) + (n.r || 58));
        });
      }
      const inner = Math.max(90, c.r * (includeOuter ? 0.78 : 0.68));
      cam.k = Math.max(includeOuter ? 0.5 : 0.72, Math.min(1.08, inner / Math.max(reach, 1)));
      applyCam();
    }

    function placeRing(center, items, radius) {
      const n = items.length || 1;
      const maxR = items.reduce((m, it) => Math.max(m, it.r || 58), 58);
      const need = (n * (maxR * 2 + 56)) / (Math.PI * 2);
      const rad = Math.max(radius || 0, need, (center.r || 96) + maxR + 52);
      items.forEach((item, i) => {
        const a = -Math.PI / 2 + (i / n) * Math.PI * 2 + (n === 2 ? 0.18 : 0);
        item.x = center.x + Math.cos(a) * rad;
        item.y = center.y + Math.sin(a) * rad;
        item.tx = item.x;
        item.ty = item.y;
        item.vx = 0;
        item.vy = 0;
      });
    }

    function placeFan(source, items, mode) {
      const word = wordNode() || { x: 2000, y: 2000, r: 96 };
      const cx = word.x;
      const cy = word.y;
      const n = items.length || 1;
      const maxR = items.reduce((m, it) => Math.max(m, it.r || 70), 70);
      const baseR = Math.hypot(source.x - cx, source.y - cy) || 248;
      const ang0 = Math.atan2(source.y - cy, source.x - cx);
      const step = Math.max(0.26, Math.min(0.48, (maxR * 2 + 36) / Math.max(baseR, 140)));
      const rad =
        mode === 'distill'
          ? Math.max((word.r || 96) + maxR + 28, baseR * 0.58)
          : baseR + (source.r || 58) + maxR + 20;
      items.forEach((item, i) => {
        const t = n === 1 ? 0 : i - (n - 1) / 2;
        const a = ang0 + t * step;
        item.x = cx + Math.cos(a) * rad;
        item.y = cy + Math.sin(a) * rad;
        item.tx = item.x;
        item.ty = item.y;
        item.vx = 0;
        item.vy = 0;
      });
    }

    function separate() {
      for (let pass = 0; pass < 3; pass++) {
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const a = nodes[i];
            const b = nodes[j];
            let dx = b.x - a.x;
            let dy = b.y - a.y;
            let d = Math.hypot(dx, dy);
            const min = a.r + b.r + 28;
            if (d >= min) continue;
            if (d < 0.001) {
              dx = 0.6;
              dy = 0.4;
              d = 1;
            }
            const overlap = min - d;
            const nx = dx / d;
            const ny = dy / d;
            const aFree = !a.pinned && dragging?.id !== a.id;
            const bFree = !b.pinned && dragging?.id !== b.id;
            const share = aFree && bFree ? 0.5 : 1;
            const move = overlap * share;
            if (aFree) {
              a.x -= nx * move;
              a.y -= ny * move;
              if (a.tx != null) {
                a.tx -= nx * move;
                a.ty -= ny * move;
              }
              a.vx *= 0.4;
              a.vy *= 0.4;
            }
            if (bFree) {
              b.x += nx * move;
              b.y += ny * move;
              if (b.tx != null) {
                b.tx += nx * move;
                b.ty += ny * move;
              }
              b.vx *= 0.4;
              b.vy *= 0.4;
            }
          }
        }
      }
    }

    function tick() {
      const now = performance.now();
      for (const n of nodes) {
        if (n.pinned || n.type === 'word' || dragging?.id === n.id) continue;
        const tx = (n.tx != null ? n.tx : n.x) - n.x;
        const ty = (n.ty != null ? n.ty : n.y) - n.y;
        const td = Math.hypot(tx, ty);
        if (td > 0.6) {
          n.vx += tx * 0.02;
          n.vy += ty * 0.02;
        } else if (n.tx != null) {
          n.x = n.tx;
          n.y = n.ty;
        }
        n.vx *= 0.7;
        n.vy *= 0.7;
        if (Math.hypot(n.vx, n.vy) < 0.08) {
          n.vx = 0;
          n.vy = 0;
        } else {
          n.x += n.vx;
          n.y += n.vy;
        }
      }
      separate();
      for (const n of nodes) {
        n.el.style.left = `${n.x}px`;
        n.el.style.top = `${n.y}px`;
        const age = now - n.born;
        n.el.style.setProperty('--enter', String(Math.min(1, age / 520)));
      }
      drawLinks(now);
      raf = requestAnimationFrame(tick);
    }

    function drawLinks(now) {
      if (!linksSvg.dataset.ready) {
        linksSvg.setAttribute('viewBox', '0 0 4000 4000');
        linksSvg.setAttribute('width', '4000');
        linksSvg.setAttribute('height', '4000');
        linksSvg.dataset.ready = '1';
      }
      let html = '';
      for (const l of links) {
        const a = byId.get(l.a);
        const b = byId.get(l.b);
        if (!a || !b) continue;
        const age = Math.min(1, (now - l.born) / 700);
        const cls = `link link-${l.kind || 'morph'}`;
        const x1 = a.x.toFixed(1);
        const y1 = a.y.toFixed(1);
        const x2 = (a.x + (b.x - a.x) * age).toFixed(1);
        const y2 = (a.y + (b.y - a.y) * age).toFixed(1);
        html += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${cls}" />`;
      }
      if (linksSvg.innerHTML !== html) linksSvg.innerHTML = html;
    }

    function endPan() {
      panning = null;
      stage.classList.remove('is-panning');
    }

    const pointers = new Map();
    let pinch = null;

    function pointerDist(a, b) {
      return Math.hypot(a.x - b.x, a.y - b.y);
    }

    function pointerMid(a, b) {
      return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    }

    stage.addEventListener('pointerdown', (ev) => {
      pointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinch = { dist: pointerDist(a, b), k: cam.k };
        dragging = null;
        endPan();
        return;
      }
      if (ev.button != null && ev.button !== 0) return;
      if (ev.target.closest('.node')) return;
      ev.preventDefault();
      panning = { x: ev.clientX, y: ev.clientY, cx: cam.x, cy: cam.y };
      stage.classList.add('is-panning');
      try {
        stage.setPointerCapture(ev.pointerId);
      } catch {
        /* ignore */
      }
    });

    stage.addEventListener('pointermove', (ev) => {
      if (pointers.has(ev.pointerId)) pointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
      if (pinch && pointers.size >= 2) {
        const [a, b] = [...pointers.values()];
        const dist = pointerDist(a, b);
        if (pinch.dist >= 8 && dist >= 8) {
          const next = Math.max(0.4, Math.min(1.8, pinch.k * (dist / pinch.dist)));
          const mid = pointerMid(a, b);
          const w = toWorld(mid.x, mid.y);
          cam.x = w.x - (w.x - cam.x) * (cam.k / next);
          cam.y = w.y - (w.y - cam.y) * (cam.k / next);
          cam.k = next;
          applyCam();
        }
        return;
      }
      if (dragging) {
        const n = byId.get(dragging.id);
        if (!n) return;
        if (Math.hypot(ev.clientX - dragging.x, ev.clientY - dragging.y) > 8) dragging.moved = true;
        if (!dragging.moved) return;
        if (dragging.lock) {
          if (panning) {
            cam.x = panning.cx - (ev.clientX - panning.x) / cam.k;
            cam.y = panning.cy - (ev.clientY - panning.y) / cam.k;
            applyCam();
          }
          return;
        }
        const w = toWorld(ev.clientX, ev.clientY);
        n.x = w.x;
        n.y = w.y;
        n.tx = w.x;
        n.ty = w.y;
        n.vx = 0;
        n.vy = 0;
        if (n.fromCabinet) {
          const t = hitAt(ev.clientX, ev.clientY, { excludeId: n.id });
          setDropTarget(t?.id);
        }
        return;
      }
      if (panning) {
        cam.x = panning.cx - (ev.clientX - panning.x) / cam.k;
        cam.y = panning.cy - (ev.clientY - panning.y) / cam.k;
        applyCam();
      }
    });

    stage.addEventListener('pointerup', (ev) => {
      pointers.delete(ev.pointerId);
      if (pointers.size < 2) pinch = null;
      const drag = dragging;
      dragging = null;
      endPan();
      const dropId = nodes.find((n) => n.el.classList.contains('is-drop-target'))?.id;
      setDropTarget(null);
      if (!drag) return;
      const n = byId.get(drag.id);
      if (drag.moved) {
        if (n?.fromCabinet) {
          const target = (dropId && byId.get(dropId)) || hitAt(ev.clientX, ev.clientY, { excludeId: n.id });
          if (target) onMix?.(n, target);
        }
        return;
      }
      if (Math.hypot(ev.clientX - drag.x, ev.clientY - drag.y) > 8) return;
      if (n) onActivate?.(n);
    });
    stage.addEventListener('pointercancel', (ev) => {
      pointers.delete(ev.pointerId);
      pinch = null;
      endPan();
    });
    stage.addEventListener('lostpointercapture', () => {
      if (!dragging) endPan();
    });

    stage.addEventListener(
      'wheel',
      (ev) => {
        ev.preventDefault();
        const factor = ev.deltaY > 0 ? 0.92 : 1.08;
        const next = Math.max(0.4, Math.min(1.8, cam.k * factor));
        const w = toWorld(ev.clientX, ev.clientY);
        cam.x = w.x - (w.x - cam.x) * (cam.k / next);
        cam.y = w.y - (w.y - cam.y) * (cam.k / next);
        cam.k = next;
        applyCam();
      },
      { passive: false }
    );

    applyCam();
    tick();
    window.addEventListener('resize', () => {
      if (wordNode()) focusWord();
      else applyCam();
    });

    return {
      addNode,
      addLink,
      select,
      get,
      all,
      clear,
      snapshot,
      restore,
      fit,
      focusWord,
      circleAnchor,
      placeRing,
      placeFan,
      applyCam,
      hitAt,
      setDropTarget,
      toWorld,
      get selectedId() {
        return selectedId;
      },
    };
  }

  VA.graph = { create };
})(typeof window !== 'undefined' ? window : globalThis);

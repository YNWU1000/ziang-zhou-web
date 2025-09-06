// js/play-mode.js
(function () {
  // Listen for paragraph becoming ready
  document.addEventListener('app:paragraph-ready', (e) => {
    const { p, baselineSnapshotHTML } = e.detail;
    wirePlayMode(p, baselineSnapshotHTML);
  });

  function wirePlayMode(p, baselineSnapshotHTML) {
    const slogan = getVisibleSlogan(p);
    if (!slogan) return;
    if (slogan.textContent.trim().toLowerCase() !== 'everything is play.') return;

    slogan.style.cursor = 'pointer';
    slogan.title = 'Play Mode';
    slogan.addEventListener('click', (ev) => {
      ev.stopPropagation();
      ev.preventDefault();
      if (!playActive) enterPlayMode(p, slogan, baselineSnapshotHTML);
      else exitPlayMode(p, baselineSnapshotHTML);
    });
  }

  function getVisibleSlogan(root) {
    const list = Array.from(root.querySelectorAll('.slogan'));
    for (const el of list) {
      const s = getComputedStyle(el);
      if (s.display !== 'none' && s.visibility !== 'hidden' && el.offsetParent !== null) return el;
    }
    return null;
  }

  // ——— Play Mode state ———
  let playActive = false;
  let followRAF = null;
  let onMoveHandler = null;
  let targetX = innerWidth / 2, targetY = innerHeight / 2;
  const shapes = new Set();
  let shapesRaf = null;

  function enterPlayMode(p, sloganEl, baselineSnapshotHTML) {
    if (playActive) return;
    playActive = true;

    document.body.classList.add('play-mode');
    sloganEl.classList.add('play-button');

    // Tokenize everything (incl. punctuation) except inside "Ziang Zhou" and the play button
    const zzEl = p.querySelector('[data-key="zz"]');
    splitIntoWordSpans(p, [zzEl, sloganEl]);

    // Collect tokens excluding the ZZ span
    let tokens = Array.from(p.querySelectorAll('.word'));
    if (zzEl) tokens = tokens.filter(n => !zzEl.contains(n));

    // Cache origin centers for each token
    const rectCache = new Map();
    for (const el of tokens) {
      const r = el.getBoundingClientRect();
      rectCache.set(el, { ox: r.left + r.width / 2, oy: r.top + r.height / 2, cx: 0, cy: 0 });
    }

    // Mouse target
    onMoveHandler = (e) => { targetX = e.clientX; targetY = e.clientY; if (!followRAF) followRAF = requestAnimationFrame(loop); };
    window.addEventListener('mousemove', onMoveHandler);

    // Slow, “creeping” approach (frame‑rate independent)
    let lastTs = performance.now();
    function loop(ts) {
      const dt = Math.min(0.05, (ts - lastTs) * 0.001); lastTs = ts;
      const base = 0.015;                            // lower = slower global speed
      const eff = 1 - Math.pow(1 - base, dt * 60);   // normalize to frame rate
      const maxStep = 12;                             // px cap per frame (keeps it creeping)

      let moving = false;
      for (const el of tokens) {
        const st = rectCache.get(el); if (!st) continue;
        const dx = targetX - st.ox;
        const dy = targetY - st.oy;

        const stepX = Math.max(-maxStep, Math.min(maxStep, dx - st.cx)) * eff;
        const stepY = Math.max(-maxStep, Math.min(maxStep, dy - st.cy)) * eff;

        st.cx += stepX; st.cy += stepY;
        el.style.transform = `translate3d(${st.cx}px, ${st.cy}px, 0)`;

        if (Math.abs(dx - st.cx) > 0.2 || Math.abs(dy - st.cy) > 0.2) moving = true;
      }
      if (moving) followRAF = requestAnimationFrame(loop); else followRAF = null;
    }
    if (!followRAF) followRAF = requestAnimationFrame(loop);

    // Shapes (exactly at click position)
    window.addEventListener('click', onShapeClick, { passive: true });

    function onShapeClick(e) {
      if (!playActive) return;
      if (e.target && e.target.classList && e.target.classList.contains('play-button')) return;
      spawnShape(e.clientX, e.clientY);
    }

    function spawnShape(mouseX, mouseY) {
      const COLORS = ['#ff2aa1', '#00e5ff', '#ffd60a'];
      const size = (rand(24, 220) | 0);
      const isCircle = Math.random() < 0.5;
      const isGravity = Math.random() < 0.5;
      const color = COLORS[(Math.random()*COLORS.length)|0];

      const el = document.createElement('div');
      el.className = `shape ${isCircle ? 'circle' : 'square'}`;
      el.style.width = size + 'px';
      el.style.height = size + 'px';
      el.style.background = color;
      document.body.appendChild(el);

      const half = size / 2;
      const s = {
        el, w: size, h: size,
        x: mouseX - half, y: mouseY - half,
        vx: rand(-80, 80), vy: rand(-40, 40),
        behavior: isGravity ? 'gravity' : 'symbol',
        g: rand(250, 1500), bounce: rand(0.2, 0.6), friction: rand(0.82, 0.96),
        born: performance.now(), life: 5000 + Math.random()*5000
      };
      shapes.add(s);
      el.style.transform = `translate3d(${s.x}px, ${s.y}px, 0)`;

      if (s.behavior === 'symbol') {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        setTimeout(() => {
          if (!shapes.has(s)) return;
          const letter = letters[(Math.random()*letters.length)|0];
          el.classList.add('symbol');
          el.textContent = letter;
          el.style.fontSize = Math.max(32, s.w) + 'px';
          el.style.transform = `translate3d(${s.x}px, ${s.y}px, 0)`;
          s.vx = rand(-40,40); s.vy = rand(-30,10);
        }, 180 + Math.random()*300);
      }

      if (shapes.size > 60) {
        const first = shapes.values().next().value;
        if (first && first.el && first.el.parentNode) first.el.parentNode.removeChild(first.el);
        shapes.delete(first);
      }

      tickShapes();
    }

    function tickShapes() {
      if (shapesRaf) return;
      let last = performance.now();
      const loop = (ts) => {
        const dt = Math.min(0.035, (ts - last) * 0.001); last = ts;
        const btn = document.querySelector('.play-button');
        const br = btn ? btn.getBoundingClientRect() : null;

        for (const s of Array.from(shapes)) {
          if (!document.body.contains(s.el)) { shapes.delete(s); continue; }

          if (s.behavior === 'gravity') {
            s.vy += s.g * dt; s.x += s.vx * dt; s.y += s.vy * dt;
            if (br) {
              const hit = s.x < br.right && s.x + s.w > br.left && s.y < br.bottom && s.y + s.h > br.top;
              if (hit && s.vy > 0) {
                s.y = br.top - s.h; s.vy = -Math.abs(s.vy) * s.bounce; s.vx *= s.friction;
              }
            }
            const floor = innerHeight - s.h;
            if (s.y > floor) { s.y = floor; s.vy = -Math.abs(s.vy) * s.bounce; s.vx *= s.friction; }
            if (s.x < 0) { s.x = 0; s.vx = Math.abs(s.vx) * s.bounce; }
            if (s.x + s.w > innerWidth) { s.x = innerWidth - s.w; s.vx = -Math.abs(s.vx) * s.bounce; }
          } else {
            s.vy += (s.g * 0.1) * dt; s.x += s.vx * dt; s.y += s.vy * dt;
          }

          s.el.style.transform = `translate3d(${s.x}px, ${s.y}px, 0)`;
          const age = ts - s.born;
          if (age > s.life) { s.el.style.opacity = '0'; setTimeout(() => destroyShape(s), 220); shapes.delete(s); }
        }

        if (shapes.size > 0) shapesRaf = requestAnimationFrame(loop);
        else { cancelAnimationFrame(shapesRaf); shapesRaf = null; }
      };
      shapesRaf = requestAnimationFrame(loop);
    }
  }

  function exitPlayMode(p, baselineSnapshotHTML) {
    if (!playActive) return;
    playActive = false;

    document.body.classList.remove('play-mode');

    if (followRAF) cancelAnimationFrame(followRAF), followRAF = null;
    if (onMoveHandler) window.removeEventListener('mousemove', onMoveHandler), onMoveHandler = null;
    window.removeEventListener('click', onShapeClick); // defensive: if bound

    // Remove word spans → restore text
    const currentWords = document.querySelectorAll('#out .word');
    currentWords.forEach(el => { el.replaceWith(document.createTextNode(el.textContent)); });

    // Clear shapes
    clearAllShapes();

    // Restore static paragraph and rewire basic interactions
    const btnWas = document.querySelector('#out .play-button');
    if (baselineSnapshotHTML != null) p.innerHTML = baselineSnapshotHTML;
    if (btnWas) {
      const again = p.querySelector('.slogan');
      if (again) again.classList.remove('play-button');
    }

    // Rewire basic interactions and re-arm Play Mode button
    if (window.App && typeof App.wireBasicInteractions === 'function') App.wireBasicInteractions(p);
    wirePlayMode(p, baselineSnapshotHTML);
  }

  // Helpers
  function splitIntoWordSpans(root, excludeEls = []) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        for (const ex of excludeEls) if (ex && ex.contains(node)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const texts = [];
    while (walker.nextNode()) texts.push(walker.currentNode);

    // Group 1 = word, Group 2 = spaces, Group 3 = single non-space (punctuation)
    const tokenRegex = /([\p{L}\p{N}’'-]+)|(\s+)|([^\s])/gu;
    for (const node of texts) {
      const parentName = node.parentNode && node.parentNode.nodeName.toLowerCase();
      if (['script','style','iframe'].includes(parentName)) continue;
      const frag = document.createDocumentFragment();
      const str = node.nodeValue;
      let m;
      while ((m = tokenRegex.exec(str)) !== null) {
        const [, word, spaces, punct] = m;
        if (spaces) {
          frag.appendChild(document.createTextNode(spaces));
        } else {
          const span = document.createElement('span');
          span.className = 'word';
          span.textContent = word || punct || '';
          frag.appendChild(span);
        }
      }
      node.parentNode.replaceChild(frag, node);
    }
  }

  function clearAllShapes() {
    if (shapesRaf) cancelAnimationFrame(shapesRaf), shapesRaf = null;
    for (const s of Array.from(shapes)) if (s.el && s.el.parentNode) s.el.parentNode.removeChild(s.el);
    shapes.clear();
  }
  function destroyShape(s) { if (s && s.el && s.el.parentNode) s.el.parentNode.removeChild(s.el); }
  function rand(a,b){ return a + Math.random()*(b-a); }

  // Dummy to avoid reference error if removed above
  function onShapeClick () {}
})();
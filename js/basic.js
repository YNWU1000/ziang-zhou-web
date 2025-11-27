// js/basic.js
(function () {
  window.App = window.App || {};

  // ——— Typing params ———
  const CHARS = "█▓▒░#%*+—=<>/\\[]{}()ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const SCRAMBLE_TAIL = 8;
  const CHARS_PER_SECOND = 14;
  const MIN_DURATION_MS  = 4000;
  const MAX_DURATION_MS  = 15000;
  const ease = (t) => 1 - Math.pow(1 - t, 3);

  const src = document.getElementById('source');
  if (!src) return;

  // (slogan sequencing removed)

  // Ensure #out exists
  let out = document.getElementById('out');
  if (!out) { out = document.createElement('p'); out.id = 'out'; src.after(out); }

    // ——— Interactions we own in basic layer ———
  App.wireBasicInteractions = function (p) {
    // Prevent duplicate bindings if called multiple times
    if (p.__basicWired) return;
    p.__basicWired = true;
    // "Ziang Zhou" click → cycle names
    const zz = p.querySelector('[data-key="zz"]');
    if (zz) {
      const cycle = ['Ziang Zhou', '周子昂', 'YNWU#MK4'];
      let index = 0, busy = false;
      zz.addEventListener('click', async () => {
        // When Play Mode is on, .chunk pointer-events are disabled by CSS.
        if (busy) return; busy = true; index = (index + 1) % cycle.length;
        await retype(zz, cycle[index]); busy = false;
      });
      async function retype(el, nextText) {
        const sleep = (ms) => new Promise(r => setTimeout(r, ms));
        while (el.textContent.length) { el.textContent = el.textContent.slice(0, -1); await sleep(14); }
        await sleep(80);
        for (const ch of nextText) {
          el.textContent += CHARS[(Math.random()*CHARS.length)|0];
          await sleep(18 + Math.random()*28);
          el.textContent = el.textContent.slice(0, -1) + ch;
          await sleep(12 + Math.random()*18);
        }
      }
    }

    // Homepage: instant word-level scramble on "Creative Technology Synthesis"
    (function setupInstantWordScramble() {
      const host = p.querySelector('[data-key="push"]');
      if (!host || host.__jitReady) return;
      const EXPECT = /\bcreative\s+technology\s+synthesis\b/i;

      const CHARSETS = [
        "█▓▒░#%*+—=<>/\\[]{}()ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
        "▖▗▘▙▚▛▜▝▞▟"
      ];

      function scrambleOnce(chEl) {
        if (chEl._iv) { clearInterval(chEl._iv); chEl._iv = null; }
        if (chEl._to) { clearTimeout(chEl._to); chEl._to = null; }
        const set = CHARSETS[(Math.random()*CHARSETS.length)|0];
        const end = 180 + Math.random()*320;
        chEl._iv = setInterval(() => { chEl.textContent = set[(Math.random()*set.length)|0]; }, 18);
        chEl._to = setTimeout(() => { clearInterval(chEl._iv); chEl._iv = null; chEl.textContent = chEl.dataset.orig || ''; }, end);
      }

      function wireWordHandlers() {
        host.querySelectorAll('.jit-word').forEach(w => {
          w.addEventListener('mouseenter', () => {
            const letters = Array.from(w.querySelectorAll('.jit-char'));
            letters.forEach((el, i) => { el._st = setTimeout(() => scrambleOnce(el), (Math.random()*140) + i*4); });
          });
          w.addEventListener('mouseleave', () => {
            const letters = Array.from(w.querySelectorAll('.jit-char'));
            letters.forEach(el => { if (el._st){clearTimeout(el._st); el._st=null;} if (el._iv){clearInterval(el._iv); el._iv=null;} if (el._to){clearTimeout(el._to); el._to=null;} el.textContent = el.dataset.orig || ''; });
          });
          w.addEventListener('touchstart', () => {
            const letters = Array.from(w.querySelectorAll('.jit-char'));
            letters.forEach((el, i) => { el._st = setTimeout(() => scrambleOnce(el), (Math.random()*140) + i*4); });
          }, { passive: true });
        });
      }

      function ensureSplit() {
        if (host.__jitReady) return;
        const raw = host.textContent;
        host.textContent = '';
        raw.split(/(\s+)/).forEach(tok => {
          if (!tok) return;
          if (/^\s+$/.test(tok)) { host.appendChild(document.createTextNode(tok)); return; }
          const w = document.createElement('span'); w.className = 'jit-word';
          for (const ch of tok) { const s = document.createElement('span'); s.className = 'jit-char'; s.textContent = ch; s.dataset.orig = ch; w.appendChild(s); }
          host.appendChild(w);
        });
        host.__jitReady = true;
        wireWordHandlers();
      }

      // Try immediately; if not fully typed yet, observe until phrase completes
      function tryInit() {
        const txt = (host.textContent || '').trim();
        if (EXPECT.test(txt)) { ensureSplit(); return true; }
        return false;
      }
      if (!tryInit()) {
        const mo = new MutationObserver(() => { if (tryInit()) mo.disconnect(); });
        mo.observe(host, { childList: true, subtree: true, characterData: true });
      }
    })();

    // (About page text behaves like main; no special click cycling)

    // Tool page: clicking the title cycles "工具" → "ツール" → "tool" with the same typing effect
    if (document.body.classList.contains('tool-page')) {
      const tw = p.querySelector('[data-key="toolword"]');
      if (tw) {
        const cycle = ['工具', 'ツール', 'Tool'];
        let index = -1; // first click goes to 0 => 工具
        let busy = false;
        tw.addEventListener('click', async () => {
          if (busy) return; busy = true; index = (index + 1) % cycle.length;
          await retype2(tw, cycle[index]); busy = false;
        });
        async function retype2(el, nextText) {
          const sleep = (ms) => new Promise(r => setTimeout(r, ms));
          while (el.textContent.length) { el.textContent = el.textContent.slice(0, -1); await sleep(14); }
          await sleep(80);
          for (const ch of nextText) {
            el.textContent += CHARS[(Math.random()*CHARS.length)|0];
            await sleep(18 + Math.random()*28);
            el.textContent = el.textContent.slice(0, -1) + ch;
            await sleep(12 + Math.random()*18);
          }
        }
      }
    }

    // --- Tool page: show info panel on hover over tools ---
    if (document.body.classList.contains('tool-page')) {
      const info = document.getElementById('toolInfo');
      const outEl = document.getElementById('out');
      const runner = document.getElementById('toolRunner');
      const frame = document.getElementById('toolFrame');
      const btnClose = document.getElementById('toolRunnerClose');
      const data = {
        particle: {
          left: ['NAi Publishers', 'Dutch / English', '1999'],
          right: ['ISBN: 90–5662–115–7', '235 × 324mm', '160 pp. Softcover'],
          titleL: 'Particle Painter', titleR: 'Publication',
          desc: 'Praesent bibendum a elit non efficitur. Etiam et velit vitae quam aliquet fermentum. Quisque sit amet nulla dictum, cursus erat a, tempus est.'
        },
        grid: {
          left: ['YNWU Studio', 'JavaScript / p5.js', '2024'],
          right: ['v1.2.3', 'Web • Interactive', 'Open source'],
          titleL: 'Generative Grid', titleR: 'Project',
          desc: 'Sed laoreet, magna eget mattis tincidunt, felis tellus vestibulum augue, in lobortis mauris risus eu nunc.'
        },
        noise: {
          left: ['YNWU Lab', 'GLSL / Noise', '2023'],
          right: ['GPU-accelerated', 'WebGL', 'Creative coding'],
          titleL: 'Noise Field', titleR: 'Tech',
          desc: 'Vivamus sed condimentum leo. Nunc efficitur, magna condimentum gravida egestas, ligula mauris posuere neque sit amet dui.'
        },
        sine: {
          left: ['Type Systems', 'Sine / Audio', '2022'],
          right: ['Experimental', 'Kinetic Typography', 'Realtime'],
          titleL: 'Type Sine Waves', titleR: 'Mode',
          desc: 'Integer euismod, justo a cursus viverra, justo magna volutpat arcu, vel feugiat nisl magna non tortor.'
        }
      };
      const tpl = (d) => `
        <div class="grid">
          <div class="heading">${d.titleL || ''}</div>
          <div class="heading">${d.titleR || ''}</div>
          <div class="muted">${(d.left||[]).join('<br>')}</div>
          <div class="muted">${(d.right||[]).join('<br>')}</div>
          <div class="desc">${d.desc || ''}</div>
        </div>`;
      const show = (key) => {
        if (!info) return;
        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        if (outEl) {
          const r = outEl.getBoundingClientRect();
          if (!isMobile) {
            // Align with top of #out, fixed on the right, no vertical centering
            info.style.left = '';
            info.style.right = '20px';
            info.style.transform = 'none';
            info.style.width = 'min(50vw, 560px)';
            info.style.top = Math.max(0, Math.round(r.top)) + 'px';
          } else {
            // No mobile flow adjustments; panel remains hidden unless hovered (desktop behavior)
          }
        }
        // Prefer editable HTML template if present; fallback to JS data object
        const tEl = document.getElementById('toolinfo-' + key);
        if (tEl) info.innerHTML = tEl.innerHTML; else {
          const d = data[key]; if (!d) return; info.innerHTML = tpl(d);
        }
        info.style.display = 'block';
      };
      const hide = () => { if (info) info.style.display = 'none'; };
      const alignCloseButton = () => {
        if (!runner || !btnClose) return;
        if (btnClose.style.display === 'none') return;
        const rect = runner.getBoundingClientRect();
        const gap = 12;
        const width = btnClose.offsetWidth || 32;
        const left = Math.max(12, rect.left - width - gap);
        const top = Math.max(12, rect.top + 18);
        btnClose.style.left = left + 'px';
        btnClose.style.top = top + 'px';
      };
      let resizeBound = false;
      p.querySelectorAll('[data-tool]').forEach(a => {
        const key = a.getAttribute('data-tool');
        a.addEventListener('mouseenter', () => show(key));
        a.addEventListener('mouseleave', hide);
        // Keyboard support for focusable elements (e.g., anchors)
        a.addEventListener && a.addEventListener('focus', () => show(key));
        a.addEventListener && a.addEventListener('blur', hide);
        // Open runner for tools that specify a p5 HTML via data-p5
        a.addEventListener('click', (e) => {
          const url = a.getAttribute('data-p5');
          // If no data-p5, show the tool info template on click
          if (!url){
            e.preventDefault && e.preventDefault();
            show(key);
            return;
          }
          if (!runner || !frame) return;
          e.preventDefault();
          hide();
          frame.src = url;
          runner.style.display = 'block';
          runner.setAttribute('aria-hidden','false');
          if (btnClose) {
            btnClose.style.display = 'inline-flex';
            btnClose.setAttribute('aria-hidden', 'false');
            requestAnimationFrame(alignCloseButton);
            if (!resizeBound) {
              window.addEventListener('resize', alignCloseButton);
              resizeBound = true;
            }
          }
        });
      });

      // Close controls
      const closeRunner = () => {
        if (!runner || !frame) return;
        runner.style.display = 'none';
        runner.setAttribute('aria-hidden','true');
        if (btnClose) {
          btnClose.style.display = 'none';
          btnClose.setAttribute('aria-hidden', 'true');
          btnClose.style.left = '';
          btnClose.style.top = '';
        }
        try { frame.src = 'about:blank'; } catch (_) {}
      };
      if (btnClose) btnClose.addEventListener('click', closeRunner);
      window.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') closeRunner(); });
    }

    // (Hover gallery on identity/interface removed)

    // SF map tooltip hover/follow
    const sf = p.querySelector('[data-key="sanfrancisco"]');
    const tip = document.getElementById('mapTooltip');
    if (sf && tip) {
      const pad = 14;
      const move = (e) => {
        const w = tip.offsetWidth, h = tip.offsetHeight, vw = innerWidth, vh = innerHeight;
        let x = e.clientX + pad, y = e.clientY + pad;
        if (x + w > vw) x = e.clientX - w - pad;
        if (y + h > vh) y = e.clientY - h - pad;
        tip.style.transform = `translate(${Math.max(0,x)}px, ${Math.max(0,y)}px)`;
      };
      const show = () => { tip.setAttribute('aria-hidden','false'); };
      const hide = () => { tip.setAttribute('aria-hidden','true'); tip.style.transform='translate(-9999px,-9999px)'; };
      sf.addEventListener('mouseenter', show);
      sf.addEventListener('mouseleave', hide);
      sf.addEventListener('mousemove', move);
    }

    // Homepage: bottom-right rabbit GIF that hides on hover of Works/Interface
    // Draggable within viewport. Double-click on the GIF fades it out slowly.
    (function wireRabbit() {
      const isHome = !document.body.classList.contains('tool-page') && !document.body.classList.contains('about-page') && !document.body.classList.contains('side-page');
      if (!isHome) return;
      if (document.getElementById('cornerRabbit')) return;
      const img = document.createElement('img');
      img.id = 'cornerRabbit';
      img.src = 'assets/rabbit.gif';
      img.alt = '';
      img.setAttribute('aria-hidden','true');
      document.body.appendChild(img);

      const works = p.querySelector('[data-key="identity"]');
      const interf = p.querySelector('[data-key="interface"]');
      const hide = () => { if (img) img.style.display = 'none'; };
      const show = () => { if (img && !img.__dismissed) img.style.display = 'block'; };
      if (works) { works.addEventListener('mouseenter', hide); works.addEventListener('mouseleave', show); }
      if (interf) { interf.addEventListener('mouseenter', hide); interf.addEventListener('mouseleave', show); }

      // Make draggable: compute starting position once image loads
      function placeInitial() {
        const w = img.naturalWidth || img.clientWidth || 300;
        const h = img.naturalHeight || img.clientHeight || 200;
        const left = Math.max(0, innerWidth - (img.getBoundingClientRect().width || w) - 20);
        const top  = Math.max(0, innerHeight - (img.getBoundingClientRect().height || h) - 40);
        img.style.position = 'fixed';
        img.style.left = left + 'px';
        img.style.top = top + 'px';
        img.style.right = 'auto';
        img.style.bottom = 'auto';
        img.style.cursor = 'grab';
      }
      if (img.complete) placeInitial(); else img.addEventListener('load', placeInitial, { once: true });

      // Drag handlers (mouse + touch)
      let dragging = false, offX = 0, offY = 0;
      const isCoarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;

      // Shared slow fade-out
      function fadeOutSlow() {
        if (img.__dismissed) return; img.__dismissed = true;
        img.style.transition = 'opacity 5s ease';
        img.style.opacity = '0';
        setTimeout(() => { if (img && img.parentNode) img.parentNode.removeChild(img); }, 5200);
      }

      function clamp(v, min, max){ return Math.max(min, Math.min(max, v)); }
      function onMoveXY(x, y){
        const nx = clamp(x - offX, 0, innerWidth - img.offsetWidth);
        const ny = clamp(y - offY, 0, innerHeight - img.offsetHeight);
        img.style.left = nx + 'px';
        img.style.top  = ny + 'px';
      }

      // Mouse drag (desktop)
      img.addEventListener('mousedown', (e) => {
        if (img.__dismissed) return;
        dragging = true; img.style.cursor = 'grabbing';
        offX = e.clientX - img.offsetLeft;
        offY = e.clientY - img.offsetTop;
        e.preventDefault();
      });
      window.addEventListener('mousemove', (e) => { if (dragging) onMoveXY(e.clientX, e.clientY); });
      window.addEventListener('mouseup', () => { if (dragging) { dragging = false; img.style.cursor = 'grab'; } });

      // Touch drag (mobile/coarse)
      img.style.touchAction = 'none';
      img.addEventListener('touchstart', (e) => {
        if (img.__dismissed) return;
        const t = e.touches && e.touches[0]; if (!t) return;
        dragging = true; img.style.cursor = 'grabbing';
        offX = t.clientX - img.offsetLeft;
        offY = t.clientY - img.offsetTop;
      }, { passive: true });
      window.addEventListener('touchmove', (e) => {
        if (!dragging) return; const t = e.touches && e.touches[0]; if (!t) return; onMoveXY(t.clientX, t.clientY);
      }, { passive: true });
      window.addEventListener('touchend', () => { if (dragging) { dragging = false; img.style.cursor = 'grab'; } }, { passive: true });
      window.addEventListener('touchcancel', () => { if (dragging) { dragging = false; img.style.cursor = 'grab'; } }, { passive: true });

      // Double-click to fade out slowly, then remove
      img.addEventListener('dblclick', fadeOutSlow);
    })();
  };

  // Clone structure, collect text nodes
  const outlets = [];
  function cloneStructure(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent;
      const t = document.createTextNode('');
      outlets.push({ node: t, text, start: 0, end: 0 });
      return t;
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node.cloneNode(false);
      if (el.id) el.removeAttribute('id');
      for (const child of node.childNodes) el.appendChild(cloneStructure(child));
      return el;
    }
    return document.createTextNode('');
  }
  const structure = cloneStructure(src);
  out.replaceWith(structure);
  structure.id = 'out';
  const p = structure;
  App.wireBasicInteractions(p);


  // Index characters for timing
  let cursor = 0;
  for (const o of outlets) { o.start = cursor; o.end = cursor + (o.text || '').length; cursor = o.end; }
  const TOTAL = cursor;
  const scaled = (TOTAL / Math.max(1, CHARS_PER_SECOND)) * 1000;
  const duration = Math.max(MIN_DURATION_MS, Math.min(MAX_DURATION_MS, Math.round(scaled)));

  // Scramble typing
  if (TOTAL === 0) finish();
  else {
    let startTime = null;
    function frame(ts) {
      if (!startTime) startTime = ts;
      const t = Math.min(1, (ts - startTime) / duration);
      const revealed = Math.floor(TOTAL * ease(t));
      for (const o of outlets) {
        const full = o.text || '';
        if (revealed >= o.end) { o.node.textContent = full; continue; }
        if (revealed <= o.start) { o.node.textContent = ''; continue; }
        const shown = revealed - o.start;
        const tip = full.slice(0, shown);
        const tailLen = Math.min(SCRAMBLE_TAIL, full.length - shown);
        let tail = '';
        for (let i = 0; i < tailLen; i++) tail += CHARS[(Math.random()*CHARS.length)|0];
        o.node.textContent = tip + tail;
      }
      if (t < 1) requestAnimationFrame(frame);
      else { for (const o of outlets) o.node.textContent = o.text || ''; finish(); }
    }
    requestAnimationFrame(frame);
  }

  let baselineSnapshotHTML = null;
  function finish() {
    baselineSnapshotHTML = p.innerHTML;
    App.wireBasicInteractions(p);
    // Signal Play Mode script that the paragraph is ready
    document.dispatchEvent(new CustomEvent('app:paragraph-ready', {
      detail: { p, baselineSnapshotHTML }
    }));
  }

  // (slogan sequence logic removed)
})();

// ——— Homepage projects: hover preview ———
(function homeProjects() {
  const panel = document.getElementById('projectsPanel');
  const preview = document.getElementById('projectPreview');
  const img = preview ? preview.querySelector('img') : null;
  if (!panel || !preview || !img) return;

  // Always animate the blur every hover, even when cached
  let lastToken = 0; // guards async load swap when moving quickly
  const MIN_BLUR_MS = 0; // keep blur visible a bit longer

  function showPreview(fullSrc, lowSrc) {
    if (!fullSrc) return;
    preview.style.display = 'block';

    const token = ++lastToken;
    img.classList.add('is-loading'); // start blurred every time

    // If we have a low-res placeholder, use it immediately while preloading full
    if (lowSrc && img.getAttribute('src') !== lowSrc) {
      img.src = lowSrc;
    }

    const swapToFull = () => {
      if (token !== lastToken) return;
      const start = performance.now();
      if (img.getAttribute('src') !== fullSrc) img.src = fullSrc;
      // Ensure the blur lasts at least MIN_BLUR_MS for a perceptible morph
      requestAnimationFrame(() => {
        const elapsed = performance.now() - start;
        const remaining = Math.max(0, MIN_BLUR_MS - elapsed);
        setTimeout(() => { if (token === lastToken) img.classList.remove('is-loading'); }, remaining);
      });
    };

    if (lowSrc) {
      // Preload then swap
      const loader = new Image();
      loader.decoding = 'async';
      loader.src = fullSrc;
      loader.onload = swapToFull;
      loader.onerror = swapToFull; // still remove blur if error
    } else {
      // No placeholder: show full image but keep blur for the minimum duration
      swapToFull();
    }
  }
  function hidePreview() {
    preview.style.display = 'none';
    // Keep src to benefit from browser cache on re-hover
  }

  function wireListHover() {
    const meta = document.getElementById('projectMeta');
    function setMetaFrom(item){
      if (!meta || panel.classList.contains('thumbs')) return;
      const link = item.querySelector('a.title');
      const title = (link && (link.textContent||'').trim()) || '';
      const subtitle = item.getAttribute('data-subtitle') || '';
      const category = item.getAttribute('data-category') || ((item.getAttribute('data-tags')||'').split(',')[0]||'').trim();
      const year = item.getAttribute('data-year') || '';
      const lines = [];
      if (title) lines.push('<div class="title">'+title+'</div>');
      if (subtitle) lines.push('<div class="muted">'+subtitle+'</div>');
      if (category) lines.push('<div class="muted">'+category+'</div>');
      if (year) lines.push('<div class="muted">'+year+'</div>');
      meta.innerHTML = lines.join('');
    }
    function clearMeta(){ const el = document.getElementById('projectMeta'); if (el) el.textContent=''; }

    panel.querySelectorAll('.proj').forEach(item => {
      const link = item.querySelector('a.title');
      if (!link) return;
      const src = item.getAttribute('data-preview');
      const low = item.getAttribute('data-preview-low');
      const maybeShow = () => { if (!panel.classList.contains('thumbs')) { showPreview(src, low); setMetaFrom(item); } };
      const maybeClear = () => { hidePreview(); clearMeta(); };
      link.addEventListener('mouseenter', maybeShow);
      link.addEventListener('mouseleave', maybeClear);
      link.addEventListener('focus', maybeShow);
      link.addEventListener('blur', maybeClear);
      link.addEventListener('touchstart', () => { if (!panel.classList.contains('thumbs')) setMetaFrom(item); }, { passive: true });
    });
  }
  wireListHover();

  // One-time concurrent scramble typing for project titles (list view)
  (function typeProjectTitlesOnceScramble(){
    if (window.App && window.App.__listTitlesTyped) return;
    if (panel.classList.contains('thumbs')) return; // only in list view
    const links = Array.from(panel.querySelectorAll('.proj a.title'));
    if (!links.length) return;

    const CHARS = "█▓▒░#%*+—=<>/\\[]{}()ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const SCRAMBLE_TAIL = 8;
    const CHARS_PER_SECOND = 10; // slightly slower than before
    const ease = (t) => 1 - Math.pow(1 - t, 3);

    const items = links.map(a => {
      const full = (a.textContent || '').trim();
      const len = full.length;
      // Duration scaled like paragraph, but with reasonable caps for short titles
      const scaled = (len / Math.max(1, CHARS_PER_SECOND)) * 1000;
      const duration = Math.max(800, Math.min(2800, Math.round(scaled)));
      return { node: a, text: full, len, duration, start: performance.now(), done: false };
    });
    // Clear all text before starting
    items.forEach(it => { it.node.textContent = ''; });

    function frame(){
      let allDone = true;
      const now = performance.now();
      for (const it of items) {
        if (it.done) continue;
        allDone = false;
        const t = Math.min(1, (now - it.start) / it.duration);
        const revealed = Math.floor(it.len * ease(t));
        const tip = it.text.slice(0, revealed);
        const tailLen = Math.min(SCRAMBLE_TAIL, Math.max(0, it.len - revealed));
        let tail = '';
        for (let i = 0; i < tailLen; i++) tail += CHARS[(Math.random()*CHARS.length)|0];
        it.node.textContent = tip + tail;
        if (t >= 1) { it.node.textContent = it.text; it.done = true; }
      }
      // If switched to thumbnail mode mid-typing, reveal everything and stop
      if (panel.classList.contains('thumbs')) {
        items.forEach(it => { it.node.textContent = it.text; it.done = true; });
        allDone = true;
      }
      if (!allDone) requestAnimationFrame(frame);
      else { if (!window.App) window.App = {}; window.App.__listTitlesTyped = true; }
    }
    requestAnimationFrame(frame);
  })();

  // Clear preview when page/tab hidden
  document.addEventListener('visibilitychange', () => { if (document.hidden) hidePreview(); });

  // View mode toggle: list ↔ thumbnails
  const btn = document.getElementById('viewToggle');
  const list = panel.querySelector('.list');
  function buildThumbsContent() {
    const baseHTML = panel.__origListHTML || list.innerHTML;
    const tmp = document.createElement('div');
    tmp.innerHTML = baseHTML;
    const result = document.createElement('div');
    Array.from(tmp.querySelectorAll('.proj')).forEach(pItem => {
      const href = (pItem.querySelector('a') && pItem.querySelector('a').getAttribute('href')) || '#';
      const name = (pItem.querySelector('a') && (pItem.querySelector('a').textContent||'').trim()) || '';
      const photosAttr = pItem.getAttribute('data-photos');
      const preview = pItem.getAttribute('data-preview');
      let photos = [];
      if (photosAttr) photos = photosAttr.split(',').map(s => s.trim()).filter(Boolean);
      else if (preview) photos = [preview];
      photos.forEach(src => {
        const wrap = document.createElement('div'); wrap.className = 'proj';
        const a = document.createElement('a'); a.href = href; a.className = 'link';
        const im = document.createElement('img'); im.className = 'thumb'; im.src = src; im.alt = name ? (name + ' preview') : '';
        a.appendChild(im); wrap.appendChild(a); result.appendChild(wrap);
      });
    });
    return result.innerHTML;
  }
  if (btn) {
    btn.addEventListener('click', () => {
      const turningOn = !panel.classList.contains('thumbs');
      if (turningOn) {
        if (!panel.__origListHTML) panel.__origListHTML = list.innerHTML;
        list.innerHTML = buildThumbsContent();
        panel.classList.add('thumbs');
        hidePreview();
        { const metaEl = document.getElementById('projectMeta'); if (metaEl) metaEl.textContent=''; }
        btn.setAttribute('aria-pressed','true');
        btn.textContent = '◨ List';
      } else {
        // Restore original list and rebind hover
        if (panel.__origListHTML) list.innerHTML = panel.__origListHTML;
        panel.classList.remove('thumbs');
        hidePreview();
        { const metaEl = document.getElementById('projectMeta'); if (metaEl) metaEl.textContent=''; }
        wireListHover();
        btn.setAttribute('aria-pressed','false');
        btn.textContent = '◧ Thumbs';
      }
    });
  }
})();

// ——— Route mouse wheel anywhere to scroll the projects list ———
(function globalWheelToProjects(){
  const panel = document.getElementById('projectsPanel');
  if (!panel) return;
  function onWheel(e){
    // Only handle vertical scroll deltas
    const dy = e.deltaY;
    if (!dy) return;
    const before = panel.scrollTop;
    panel.scrollTop = Math.max(0, Math.min(panel.scrollTop + dy, panel.scrollHeight - panel.clientHeight));
    const changed = panel.scrollTop !== before;
    if (changed) e.preventDefault();
  }
  window.addEventListener('wheel', onWheel, { passive: false });
})();

// ——— Align projects list top with paragraph (#out) ———
(function alignProjectsToParagraph(){
  const panel = document.getElementById('projectsPanel');
  const out = document.getElementById('out');
  if (!panel || !out) return;

  function apply(){
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const r = out.getBoundingClientRect();
    if (isMobile) {
      // Mobile positioning controlled by CSS: clear any JS offsets
      panel.style.top = '';
      panel.style.marginTop = '';
      panel.style.transform = '';
    } else if (!panel.classList.contains('thumbs')) {
      panel.style.marginTop = '';
      panel.style.top = Math.max(0, Math.round(r.top)) + 'px';
    } else {
      // Thumbnails mode on desktop: CSS controls top/transform/width
      panel.style.top = '';
      panel.style.marginTop = '';
    }
  }

  // Run on ready and on resize
  apply();
  window.addEventListener('resize', apply);
  // When typing completes, event is fired from basic.js
  document.addEventListener('app:paragraph-ready', apply);
})();

// ——— Homepage: word-level scramble on hover for
// "Creative Technology Synthesis" — letters in the hovered word
// scramble asynchronously, then resolve back.
document.addEventListener('app:paragraph-ready', (e) => {
  const p = e && e.detail && e.detail.p; if (!p) return;
  const host = Array.from(p.querySelectorAll('[data-key="push"]'))
    .find(el => /creative\s+technology\s+synthesis/i.test((el.textContent||'').trim()));
  if (!host || host.__jitReady) return; host.__jitReady = true;

  const CHARSETS = [
    "█▓▒░#%*+—=<>/\\[]{}()ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
    "0123456789ABCDEF▌░▒▓█"
  ];

  // Split into word spans, then into char spans (preserve spaces)
  const raw = host.textContent;
  host.textContent = '';
  raw.split(/(\s+)/).forEach(tok => {
    if (!tok) return;
    if (/^\s+$/.test(tok)) { host.appendChild(document.createTextNode(tok)); return; }
    const w = document.createElement('span'); w.className = 'jit-word';
    for (const ch of tok) {
      const s = document.createElement('span'); s.className = 'jit-char'; s.textContent = ch; s.dataset.orig = ch; w.appendChild(s);
    }
    host.appendChild(w);
  });

  function scrambleOnce(chEl) {
    // Clear any previous timers
    if (chEl._iv) { clearInterval(chEl._iv); chEl._iv = null; }
    if (chEl._to) { clearTimeout(chEl._to); chEl._to = null; }
    const set = CHARSETS[(Math.random()*CHARSETS.length)|0];
    const end = 180 + Math.random()*320; // 180–500ms
    chEl._iv = setInterval(() => {
      chEl.textContent = set[(Math.random()*set.length)|0];
    }, 18);
    chEl._to = setTimeout(() => {
      clearInterval(chEl._iv); chEl._iv = null;
      chEl.textContent = chEl.dataset.orig || '';
    }, end);
  }

  function enterWord(wEl) {
    const letters = Array.from(wEl.querySelectorAll('.jit-char'));
    letters.forEach((el, i) => {
      const delay = (Math.random()*140) + i*4; // slight desync
      el._st = setTimeout(() => scrambleOnce(el), delay);
    });
  }
  function leaveWord(wEl) {
    const letters = Array.from(wEl.querySelectorAll('.jit-char'));
    letters.forEach(el => {
      if (el._st) { clearTimeout(el._st); el._st = null; }
      if (el._iv) { clearInterval(el._iv); el._iv = null; }
      if (el._to) { clearTimeout(el._to); el._to = null; }
      el.textContent = el.dataset.orig || '';
    });
  }

  host.querySelectorAll('.jit-word').forEach(w => {
    w.addEventListener('mouseenter', () => enterWord(w));
    w.addEventListener('mouseleave', () => leaveWord(w));
    // touch: trigger once on touchstart
    w.addEventListener('touchstart', () => enterWord(w), { passive: true });
  });
}, { once: false });

// Swap the leading ✎ with a loading GIF on hover (after typing is ready)
// Swap the leading ✎ with a loading GIF on hover (after typing is ready)
// (construct GIF hover behavior removed)

// Fallback: delegated click handler for "Graphic Design" in case local wiring missed
(function globalEmojiRainBinder(){
  let raining = false;
  const EMOJIS = ['😹','👍','🫶','🖕','🦾','🙌','👀'];
  function runEmojiRain(){
    if (raining) return; raining = true;
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.pointerEvents = 'none';
    overlay.style.overflow = 'hidden';
    overlay.style.zIndex = '999';
    document.body.appendChild(overlay);

    const speed = 520, spawnEvery = 60, jitter = 18, emissionMs = 3000;
    const baseEl = document.querySelector('#out [data-key="designer"]') || document.querySelector('[data-key="designer"]') || document.getElementById('out') || document.body;
    const baseSize = parseFloat(getComputedStyle(baseEl).fontSize) || 24;
    const endAt = performance.now() + emissionMs; let active = 0;
    function finish(){ if (overlay.parentNode) overlay.parentNode.removeChild(overlay); raining = false; }
    function spawn(){
      const now = performance.now();
      if (now > endAt) { if (active===0) finish(); return; }
      const s = document.createElement('span'); s.textContent = EMOJIS[(Math.random()*EMOJIS.length)|0];
      s.style.fontSize = baseSize * 30 + 'px';
      s.style.position = 'fixed'; s.style.willChange='transform';
      const y0 = -60 - Math.random()*60, x0 = -innerHeight + Math.random()*(innerWidth + innerHeight);
      s.style.top = y0+'px'; s.style.left = x0+'px';
      overlay.appendChild(s);
      const dy = innerHeight - y0 + 80, dx = dy, dur = Math.max(0.6, dy/speed);
      s.style.transition = `transform ${dur}s linear`;
      active++;
      requestAnimationFrame(()=>{ s.style.transform = `translate(${dx}px, ${dy}px)`; });
      s.addEventListener('transitionend', ()=>{ if (s.parentNode) s.parentNode.removeChild(s); if(--active===0 && performance.now()>endAt) finish(); });
      setTimeout(spawn, spawnEvery + (Math.random()*jitter|0));
    }
    spawn();
  }
  document.addEventListener('click', (ev)=>{
    const el = ev.target.closest('[data-key="designer"]');
    if (el) runEmojiRain();
  });
})();

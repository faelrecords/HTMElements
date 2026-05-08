// Script que é injetado dentro do iframe pra capturar hover/click,
// editar elementos e comunicar com o app React via postMessage.
//
// Tudo aqui roda DENTRO do iframe, então não tem acesso ao React.
// Stringificamos pra injetar no <head> do HTML do usuário.

export const IFRAME_BRIDGE_SCRIPT = `
(function() {
  if (window.__heBridgeLoaded) return;
  window.__heBridgeLoaded = true;

  let counter = 0;
  let draggedId = null;
  let selectedId = null;
  let externalInsertHTML = '';
  let dropState = null;
  let absoluteDrag = null;
  let resizeDrag = null;
  const CONTAINER_TAGS = ['BODY', 'MAIN', 'SECTION', 'HEADER', 'FOOTER', 'NAV', 'ARTICLE', 'ASIDE'];
  function genId() {
    counter += 1;
    return 'he-' + Date.now().toString(36) + '-' + counter.toString(36);
  }

  // adiciona data-he-id em todos os elementos do body (exceto script/style)
  function tagAll(root) {
    const all = root.querySelectorAll('*');
    all.forEach(el => {
      if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE') return;
      if (!el.hasAttribute('data-he-id')) {
        el.setAttribute('data-he-id', genId());
      }
      if (el !== document.body) el.setAttribute('draggable', 'true');
      if (isContainer(el)) el.setAttribute('data-he-container', '');
    });
    if (root === document.body && !root.hasAttribute('data-he-id')) {
      root.setAttribute('data-he-id', 'he-root');
    }
    if (root === document.body) root.setAttribute('data-he-container', '');
    renderCodepens(root);
  }

  function codepenDoc(html, css, js) {
    return '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>' + (css || '') + '</style></head><body>' + (html || '') + '<script>' + (js || '') + '<\\/script></body></html>';
  }

  function renderCodepens(root = document) {
    root.querySelectorAll?.('[data-he-codepen]').forEach(el => {
      let frame = el.querySelector('iframe');
      if (!frame) {
        frame = document.createElement('iframe');
        frame.title = 'CodePen importado';
        frame.setAttribute('sandbox', 'allow-scripts allow-forms allow-popups allow-pointer-lock allow-same-origin');
        frame.style.cssText = 'width:100%;height:100%;border:0;display:block;';
        el.appendChild(frame);
      }
      const doc = codepenDoc(el.getAttribute('data-codepen-html') || '', el.getAttribute('data-codepen-css') || '', el.getAttribute('data-codepen-js') || '');
      if (frame.getAttribute('srcdoc') !== doc) frame.setAttribute('srcdoc', doc);
    });
  }

  function upsertStyle(id, css) {
    let styleEl = document.getElementById(id);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = id;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = css || '';
  }

  function isContainer(el) {
    if (!el || !el.tagName) return false;
    if (CONTAINER_TAGS.includes(el.tagName)) return true;
    return el.tagName === 'DIV' && el.children.length > 0;
  }

  tagAll(document.body);
  renderCodepens(document);

  if (!document.getElementById('__he_animation_styles')) {
    const animationStyle = document.createElement('style');
    animationStyle.id = '__he_animation_styles';
    animationStyle.textContent = \`
    @keyframes he-fade-in { from { opacity: 0; } to { opacity: 1; } }
    @keyframes he-fade-up { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes he-fade-down { from { opacity: 0; transform: translateY(-28px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes he-fade-left { from { opacity: 0; transform: translateX(28px); } to { opacity: 1; transform: translateX(0); } }
    @keyframes he-fade-right { from { opacity: 0; transform: translateX(-28px); } to { opacity: 1; transform: translateX(0); } }
    @keyframes he-slide-up { from { transform: translateY(36px); } to { transform: translateY(0); } }
    @keyframes he-slide-down { from { transform: translateY(-36px); } to { transform: translateY(0); } }
    @keyframes he-slide-left { from { transform: translateX(36px); } to { transform: translateX(0); } }
    @keyframes he-slide-right { from { transform: translateX(-36px); } to { transform: translateX(0); } }
    @keyframes he-zoom-in { from { opacity: 0; transform: scale(.82); } to { opacity: 1; transform: scale(1); } }
    @keyframes he-zoom-out { from { opacity: 0; transform: scale(1.18); } to { opacity: 1; transform: scale(1); } }
    @keyframes he-scale-up { from { transform: scale(.92); } to { transform: scale(1); } }
    @keyframes he-scale-down { from { transform: scale(1.08); } to { transform: scale(1); } }
    @keyframes he-rotate-in { from { opacity: 0; transform: rotate(-10deg) scale(.94); } to { opacity: 1; transform: rotate(0) scale(1); } }
    @keyframes he-flip-x { from { opacity: 0; transform: perspective(900px) rotateX(80deg); } to { opacity: 1; transform: perspective(900px) rotateX(0); } }
    @keyframes he-flip-y { from { opacity: 0; transform: perspective(900px) rotateY(80deg); } to { opacity: 1; transform: perspective(900px) rotateY(0); } }
    @keyframes he-bounce { 0%,20%,53%,80%,100% { transform: translateY(0); } 40%,43% { transform: translateY(-24px); } 70% { transform: translateY(-12px); } 90% { transform: translateY(-4px); } }
    @keyframes he-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.05); } }
    @keyframes he-shake { 0%,100% { transform: translateX(0); } 20%,60% { transform: translateX(-8px); } 40%,80% { transform: translateX(8px); } }
    @keyframes he-swing { 20% { transform: rotate(10deg); } 40% { transform: rotate(-8deg); } 60% { transform: rotate(5deg); } 80% { transform: rotate(-3deg); } 100% { transform: rotate(0); } }
    @keyframes he-wobble { 0%,100% { transform: translateX(0); } 15% { transform: translateX(-18px) rotate(-5deg); } 30% { transform: translateX(14px) rotate(3deg); } 45% { transform: translateX(-10px) rotate(-3deg); } 60% { transform: translateX(6px) rotate(2deg); } 75% { transform: translateX(-3px) rotate(-1deg); } }
    @keyframes he-blur-in { from { opacity: 0; filter: blur(12px); } to { opacity: 1; filter: blur(0); } }
    @keyframes he-blur-out { from { opacity: 1; filter: blur(0); } to { opacity: 0; filter: blur(12px); } }
    @keyframes he-reveal-mask { from { opacity: 0; clip-path: inset(0 100% 0 0); } to { opacity: 1; clip-path: inset(0 0 0 0); } }
    @keyframes he-typewriter { from { clip-path: inset(0 100% 0 0); } to { clip-path: inset(0 0 0 0); } }
    @keyframes he-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
    @keyframes he-glow { 0%,100% { filter: drop-shadow(0 0 0 rgba(109,113,240,0)); } 50% { filter: drop-shadow(0 0 14px rgba(109,113,240,.75)); } }
    @keyframes he-skew-in { from { opacity: 0; transform: skewX(-12deg) translateX(-24px); } to { opacity: 1; transform: skewX(0) translateX(0); } }
    @keyframes he-elastic { 0% { transform: scale(.7); } 45% { transform: scale(1.12); } 70% { transform: scale(.96); } 100% { transform: scale(1); } }
    @keyframes he-pop { 0% { opacity: 0; transform: scale(.6); } 70% { opacity: 1; transform: scale(1.08); } 100% { transform: scale(1); } }
    @keyframes he-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    [data-he-animation-trigger="hover"]:not(:hover) { animation-name: none !important; }
    [style*="he-typewriter"] { display: inline-block; overflow: hidden; white-space: nowrap; border-right: .08em solid currentColor; }
    [data-he-animation-trigger="scroll"] { animation-play-state: paused !important; }
    [data-he-animation-trigger="scroll"].he-animate-in-view { animation-play-state: running !important; }
    .he-animation-preview { animation-name: none !important; }
    \`;
    document.head.appendChild(animationStyle);
  }

  if (!document.getElementById('__he_animation_runtime')) {
    const animationRuntime = document.createElement('script');
    animationRuntime.id = '__he_animation_runtime';
    animationRuntime.textContent = "(() => { const run = () => { const io = new IntersectionObserver(entries => entries.forEach(entry => entry.target.classList.toggle('he-animate-in-view', entry.isIntersecting)), { threshold: 0.15 }); document.querySelectorAll('[data-he-animation-trigger=scroll]').forEach(el => io.observe(el)); }; if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run(); })();";
    document.head.appendChild(animationRuntime);
  }

  if (!document.getElementById('__he_carousel_runtime')) {
    const carouselRuntime = document.createElement('script');
    carouselRuntime.id = '__he_carousel_runtime';
    carouselRuntime.textContent = "(() => { const page = track => Math.max(1, Math.round(track.clientWidth * .92)); const move = (root, dir) => { const track = root.querySelector('[data-he-carousel-track]'); if (track) track.scrollBy({ left: dir * page(track), behavior: 'smooth' }); }; document.addEventListener('click', e => { const prev = e.target.closest('[data-he-carousel-prev]'); const next = e.target.closest('[data-he-carousel-next]'); if (!prev && !next) return; e.preventDefault(); move(e.target.closest('[data-he-carousel]'), next ? 1 : -1); }, true); document.addEventListener('pointerdown', e => { const track = e.target.closest('[data-he-carousel-track]'); if (!track || e.target.closest('a,button,input,textarea,select')) return; let down = true, startX = e.clientX, startLeft = track.scrollLeft; track.setPointerCapture?.(e.pointerId); track.style.cursor = 'grabbing'; const onMove = ev => { if (!down) return; const dx = ev.clientX - startX; if (Math.abs(dx) > 3) ev.preventDefault(); track.scrollLeft = startLeft - dx; }; const end = () => { down = false; track.style.cursor = 'grab'; window.removeEventListener('pointermove', onMove, true); window.removeEventListener('pointerup', end, true); window.removeEventListener('pointercancel', end, true); }; window.addEventListener('pointermove', onMove, true); window.addEventListener('pointerup', end, true); window.addEventListener('pointercancel', end, true); }, true); })();";
    document.head.appendChild(carouselRuntime);
  }

  // estilos do editor
  const style = document.createElement('style');
  style.id = '__he_editor_styles';
  style.textContent = \`
    [data-he-hover] { outline: 2px dashed #6d71f0 !important; outline-offset: -2px; cursor: pointer !important; }
    [data-he-selected] { outline: 2px solid #6d71f0 !important; outline-offset: -2px; }
    [data-he-drop] { outline: 2px solid #27c08a !important; outline-offset: 3px; }
    [data-he-dragging] { opacity: .45 !important; }
    [data-he-container] { outline: 1px dashed rgba(109,113,240,.22); outline-offset: -1px; }
    [data-he-container]:hover { outline-color: rgba(109,113,240,.55); }
    #__he_drop_line {
      position: fixed;
      z-index: 2147483646;
      pointer-events: none;
      background: #27c08a;
      box-shadow: 0 0 0 2px rgba(39,192,138,.18);
      display: none;
    }
    #__he_insert_button {
      position: fixed;
      z-index: 2147483647;
      width: 28px;
      height: 28px;
      border-radius: 999px;
      border: 2px solid #fff;
      background: #6d71f0;
      color: #fff;
      font: 800 20px/20px -apple-system, sans-serif;
      display: none;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 10px 24px rgba(0,0,0,.24);
    }
    #__he_resize_handle {
      position: fixed;
      z-index: 2147483647;
      width: 12px;
      height: 12px;
      border-radius: 4px;
      border: 2px solid #fff;
      background: #27c08a;
      box-shadow: 0 8px 18px rgba(0,0,0,.24);
      cursor: nwse-resize;
      display: none;
    }
    [data-he-locked="true"] { outline-color: rgba(240,109,109,.8) !important; }
    @media (max-width: 480px) {
      html, body { max-width: 100% !important; overflow-x: hidden !important; }
      img, video, iframe, table { max-width: 100% !important; }
      [data-he-id] { max-width: 100% !important; }
      h1, h2, h3, p, a, span, li, button { overflow-wrap: anywhere !important; word-break: normal !important; }
    }
    [data-he-selected]::before {
      content: attr(data-he-tag);
      position: absolute;
      top: -22px;
      left: max(-2px, calc(4px - var(--he-selected-left, 0px)));
      background: #6d71f0;
      color: #fff;
      font: 600 11px/1 -apple-system, sans-serif;
      padding: 4px 8px;
      border-radius: 4px 4px 4px 0;
      pointer-events: none;
      z-index: 99999;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    body { cursor: default; }
    html, body { scrollbar-width: none !important; }
    html::-webkit-scrollbar, body::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
    a[data-he-id] { pointer-events: auto; }
  \`;
  document.head.appendChild(style);

  const dropLine = document.createElement('div');
  dropLine.id = '__he_drop_line';
  dropLine.setAttribute('data-he-ui', '');
  document.body.appendChild(dropLine);

  const insertButton = document.createElement('button');
  insertButton.id = '__he_insert_button';
  insertButton.type = 'button';
  insertButton.textContent = '+';
  insertButton.setAttribute('data-he-ui', '');
  document.body.appendChild(insertButton);

  const resizeHandle = document.createElement('div');
  resizeHandle.id = '__he_resize_handle';
  resizeHandle.setAttribute('data-he-ui', '');
  document.body.appendChild(resizeHandle);

  function getEl(id) { return document.querySelector('[data-he-id="' + id + '"]'); }

  function clearMarkers(attr) {
    document.querySelectorAll('[' + attr + ']').forEach(el => el.removeAttribute(attr));
    if (attr === 'data-he-selected') {
      document.querySelectorAll('[style*="--he-selected-left"]').forEach(el => el.style.removeProperty('--he-selected-left'));
      resizeHandle.style.display = 'none';
    }
  }

  function markSelected(el) {
    clearMarkers('data-he-selected');
    selectedId = el.getAttribute('data-he-id');
    el.setAttribute('data-he-selected', '');
    el.setAttribute('data-he-tag', el.tagName.toLowerCase());
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--he-selected-left', Math.round(rect.left) + 'px');
    showResizeHandle(el);
  }

  function canDrop(dragged, target, insertHTML) {
    if (!target) return false;
    if (!dragged && insertHTML) return true;
    if (!dragged || dragged === target) return false;
    if (dragged === document.body) return false;
    return !dragged.contains(target);
  }

  function getInsertHTML() {
    try {
      return parent.__heInsertHTML || parent.localStorage.getItem('htmelements:drag-html') || localStorage.getItem('htmelements:drag-html') || '';
    } catch {
      try { return localStorage.getItem('htmelements:drag-html') || ''; } catch { return ''; }
    }
  }

  function clearInsertHTML() {
    try {
      parent.__heInsertHTML = null;
      parent.localStorage.removeItem('htmelements:drag-html');
      localStorage.removeItem('htmelements:drag-html');
    } catch {
      try { localStorage.removeItem('htmelements:drag-html'); } catch {}
    }
  }

  function insertHTMLAtPoint(html, x, y) {
    const target = document.elementFromPoint(x, y)?.closest('[data-he-id]') || document.body;
    const wrap = document.createElement('div');
    wrap.innerHTML = html;
    const node = wrap.firstElementChild;
    if (!node) return;
    tagAll(wrap);
    const rect = target.getBoundingClientRect();
    const parent = target === document.body ? document.body : target.parentElement;
    if (!parent) return;
    const after = y > rect.top + rect.height / 2;
    if (target.matches?.('[data-he-carousel-slide]')) target.appendChild(node);
    else if (target === document.body) parent.appendChild(node);
    else if (after) parent.insertBefore(node, target.nextSibling);
    else parent.insertBefore(node, target);
    markSelected(node);
    postChange(node);
  }

  function clearDrop() {
    clearMarkers('data-he-drop');
    dropLine.style.display = 'none';
    dropState = null;
  }

  function previewExternalPointer(x, y) {
    const target = document.elementFromPoint(x, y)?.closest('[data-he-id]');
    if (!target) return clearDrop();
    clearDrop();
    dropState = getDropState({ clientX: x, clientY: y }, target);
    showDropLine(dropState);
  }

  function getDropState(e, target) {
    const rect = target.getBoundingClientRect();
    const parent = target.parentElement;
    const pcs = parent ? getComputedStyle(parent) : null;
    const horizontal = pcs && ((pcs.display.includes('flex') && (pcs.flexDirection || '').startsWith('row')) || pcs.display.includes('grid'));
    const before = horizontal
      ? e.clientX < rect.left + rect.width / 2
      : e.clientY < rect.top + rect.height / 2;
    return { target, before, horizontal, rect };
  }

  function showDropLine(state) {
    const r = state.rect;
    if (state.horizontal) {
      dropLine.style.width = '3px';
      dropLine.style.height = Math.max(24, r.height) + 'px';
      dropLine.style.left = (state.before ? r.left : r.right) + 'px';
      dropLine.style.top = r.top + 'px';
    } else {
      dropLine.style.width = Math.max(36, r.width) + 'px';
      dropLine.style.height = '3px';
      dropLine.style.left = r.left + 'px';
      dropLine.style.top = (state.before ? r.top : r.bottom) + 'px';
    }
    dropLine.style.display = 'block';
  }

  function showInsertButton(el) {
    if (!isContainer(el) || el === document.body) return hideInsertButton();
    const r = el.getBoundingClientRect();
    insertButton.dataset.targetId = el.getAttribute('data-he-id') || '';
    insertButton.style.left = Math.max(8, r.left + r.width / 2 - 14) + 'px';
    insertButton.style.top = Math.max(8, r.bottom - 14) + 'px';
    insertButton.style.display = 'flex';
  }

  function hideInsertButton() {
    insertButton.style.display = 'none';
    insertButton.dataset.targetId = '';
  }

  function showResizeHandle(el) {
    if (!el || el === document.body) {
      resizeHandle.style.display = 'none';
      return;
    }
    const r = el.getBoundingClientRect();
    resizeHandle.dataset.targetId = el.getAttribute('data-he-id') || '';
    resizeHandle.style.left = Math.max(4, r.right - 6) + 'px';
    resizeHandle.style.top = Math.max(4, r.bottom - 6) + 'px';
    resizeHandle.style.display = 'block';
  }

  function snap(v) { return Math.round(v / 8) * 8; }

  document.addEventListener('dragstart', (e) => {
    if (e.target.closest('[data-he-ui]')) return;
    if (e.target.closest('[data-he-carousel-track]')) return;
    const el = e.target.closest('[data-he-id]');
    if (!el || el === document.body) return;
    if (el.getAttribute('data-he-locked') === 'true') {
      e.preventDefault();
      return;
    }
    const cs = getComputedStyle(el);
    if (cs.position === 'absolute' || cs.position === 'fixed') {
      e.preventDefault();
      return;
    }
    draggedId = el.getAttribute('data-he-id');
    if (e.altKey && el.parentElement) {
      const clone = el.cloneNode(true);
      clone.querySelectorAll('[data-he-id]').forEach(n => n.setAttribute('data-he-id', genId()));
      clone.setAttribute('data-he-id', genId());
      el.parentElement.insertBefore(clone, el.nextSibling);
      draggedId = clone.getAttribute('data-he-id');
      markSelected(clone);
      postChange(clone);
    }
    hideInsertButton();
    el.setAttribute('data-he-dragging', '');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', draggedId);
  }, true);

  document.addEventListener('dragover', (e) => {
    const target = e.target.closest('[data-he-id]');
    const dragged = getEl(draggedId);
    const insertHTML = externalInsertHTML || getInsertHTML() || (Array.from(e.dataTransfer.types || []).includes('text/html') ? '<div></div>' : '');
    if (!canDrop(dragged, target, insertHTML)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    clearDrop();
    dropState = getDropState(e, target);
    showDropLine(dropState);
  }, true);

  document.addEventListener('drop', (e) => {
    const target = e.target.closest('[data-he-id]');
    const dragged = getEl(draggedId);
    const insertHTML = externalInsertHTML || getInsertHTML() || e.dataTransfer.getData('text/html');
    clearDrop();
    if (!canDrop(dragged, target, insertHTML)) return;
    e.preventDefault();
    const state = dropState || getDropState(e, target);
    if (insertHTML) {
      const wrap = document.createElement('div');
      wrap.innerHTML = insertHTML;
      const node = wrap.firstElementChild;
      if (!node || !target.parentElement) return;
      tagAll(wrap);
      if (target.matches?.('[data-he-carousel-slide]')) target.appendChild(node);
      else if (state.before) target.parentElement.insertBefore(node, target);
      else target.parentElement.insertBefore(node, target.nextSibling);
      clearInsertHTML();
      externalInsertHTML = '';
      markSelected(node);
      postChange(node);
      return;
    }
    if (state.before && target.parentElement) target.parentElement.insertBefore(dragged, target);
    else if (target.parentElement) target.parentElement.insertBefore(dragged, target.nextSibling);
    if (dragged) {
      dragged.removeAttribute('data-he-dragging');
      markSelected(dragged);
      postChange(dragged);
    }
  }, true);

  document.addEventListener('dragend', () => {
    const dragged = getEl(draggedId);
    if (dragged) dragged.removeAttribute('data-he-dragging');
    draggedId = null;
    clearInsertHTML();
    externalInsertHTML = '';
    clearDrop();
  }, true);

  document.addEventListener('pointerdown', (e) => {
    if (e.target === resizeHandle) {
      const el = getEl(resizeHandle.dataset.targetId);
      if (!el || el === document.body) return;
      const r = el.getBoundingClientRect();
      resizeDrag = { el, startX: e.clientX, startY: e.clientY, width: r.width, height: r.height };
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (e.button !== 0 || e.target.closest('[data-he-ui]')) return;
    const el = e.target.closest('[data-he-id]');
    if (!el || el === document.body || el.closest('[data-he-carousel-track]')) return;
    if (el.getAttribute('data-he-locked') === 'true') return;
    const cs = getComputedStyle(el);
    if (cs.position !== 'absolute' && cs.position !== 'fixed') return;
    if (e.target.closest('input,textarea,select,button,a')) return;
    const rect = el.getBoundingClientRect();
    const parentRect = cs.position === 'fixed'
      ? { left: 0, top: 0 }
      : (el.offsetParent || document.body).getBoundingClientRect();
    absoluteDrag = {
      el,
      position: cs.position,
      startX: e.clientX,
      startY: e.clientY,
      startLeft: rect.left - parentRect.left,
      startTop: rect.top - parentRect.top,
      parentLeft: parentRect.left,
      parentTop: parentRect.top,
      moved: false
    };
    markSelected(el);
    e.preventDefault();
    e.stopPropagation();
  }, true);

  document.addEventListener('pointermove', (e) => {
    if (!absoluteDrag) return;
    const dx = e.clientX - absoluteDrag.startX;
    const dy = e.clientY - absoluteDrag.startY;
    if (Math.abs(dx) + Math.abs(dy) > 2) absoluteDrag.moved = true;
    absoluteDrag.el.style.setProperty('left', snap(absoluteDrag.startLeft + dx) + 'px', 'important');
    absoluteDrag.el.style.setProperty('top', snap(absoluteDrag.startTop + dy) + 'px', 'important');
    absoluteDrag.el.style.removeProperty('right');
    absoluteDrag.el.style.removeProperty('bottom');
    showResizeHandle(absoluteDrag.el);
    e.preventDefault();
  }, true);

  document.addEventListener('pointermove', (e) => {
    if (!resizeDrag) return;
    const w = Math.max(16, snap(resizeDrag.width + e.clientX - resizeDrag.startX));
    const h = Math.max(16, snap(resizeDrag.height + e.clientY - resizeDrag.startY));
    resizeDrag.el.style.setProperty('width', w + 'px', 'important');
    resizeDrag.el.style.setProperty('height', h + 'px', 'important');
    showResizeHandle(resizeDrag.el);
    e.preventDefault();
  }, true);

  document.addEventListener('pointerup', (e) => {
    if (!absoluteDrag) return;
    const el = absoluteDrag.el;
    const moved = absoluteDrag.moved;
    absoluteDrag = null;
    if (moved) {
      markSelected(el);
      postChange(el);
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);

  document.addEventListener('pointerup', (e) => {
    if (!resizeDrag) return;
    const el = resizeDrag.el;
    resizeDrag = null;
    markSelected(el);
    postChange(el);
    e.preventDefault();
    e.stopPropagation();
  }, true);

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Delete' && e.key !== 'Backspace') return;
    const tag = e.target?.tagName?.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target?.isContentEditable) return;
    const el = getEl(selectedId);
    if (!el || el === document.body) return;
    e.preventDefault();
    e.stopPropagation();
    const parentEl = el.parentElement;
    el.remove();
    selectedId = null;
    clearMarkers('data-he-selected');
    parent.postMessage({ type: 'he:select', id: null, info: null }, '*');
    parent.postMessage({ type: 'he:changed' }, '*');
    sendTree();
    if (parentEl && parentEl !== document.body) markSelected(parentEl);
  }, true);

  // intercepta cliques em links pra evitar navegação
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-he-ui]')) return;
    const prev = e.target.closest('[data-he-carousel-prev]');
    const next = e.target.closest('[data-he-carousel-next]');
    if (prev || next) {
      e.preventDefault();
      e.stopPropagation();
      const root = e.target.closest('[data-he-carousel]');
      const track = root?.querySelector('[data-he-carousel-track]');
      if (track) track.scrollBy({ left: (next ? 1 : -1) * Math.max(1, Math.round(track.clientWidth * .92)), behavior: 'smooth' });
      return;
    }
    const el = e.target.closest('[data-he-id]');
    e.preventDefault();
    e.stopPropagation();
    if (!el) return;
    markSelected(el);
    parent.postMessage({
      type: 'he:select',
      id: el.getAttribute('data-he-id'),
      tag: el.tagName.toLowerCase(),
      info: getElementInfo(el)
    }, '*');
  }, true);

  document.addEventListener('mouseover', (e) => {
    if (e.target.closest('[data-he-ui]')) return;
    const el = e.target.closest('[data-he-id]');
    if (!el) return;
    clearMarkers('data-he-hover');
    if (!el.hasAttribute('data-he-selected')) {
      el.setAttribute('data-he-hover', '');
    }
    parent.postMessage({ type: 'he:hover', id: el.getAttribute('data-he-id') }, '*');
    showInsertButton(el.closest('[data-he-container]'));
  }, true);

  document.addEventListener('mouseout', (e) => {
    clearMarkers('data-he-hover');
    parent.postMessage({ type: 'he:hover', id: null }, '*');
  }, true);

  insertButton.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const target = getEl(insertButton.dataset.targetId);
    if (!target || !target.parentElement) return;
    const wrap = document.createElement('div');
    wrap.innerHTML = '<section style="padding:56px 20px;background:#ffffff;"><div style="max-width:1120px;margin:0 auto;"><h2 style="font-size:32px;line-height:1.15;margin:0 0 12px;color:#0f172a;">Nova seção</h2><p style="font-size:16px;line-height:1.6;color:#64748b;margin:0;">Clique para editar este conteúdo.</p></div></section>';
    const node = wrap.firstElementChild;
    tagAll(wrap);
    target.parentElement.insertBefore(node, target.nextSibling);
    hideInsertButton();
    markSelected(node);
    postChange(node);
  });

  // bloqueia submit e navegação
  document.addEventListener('submit', (e) => { e.preventDefault(); }, true);

  const animationObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('he-animate-in-view');
      else entry.target.classList.remove('he-animate-in-view');
    });
  }, { threshold: 0.15 });

  function watchAnimations() {
    document.querySelectorAll('[data-he-animation-trigger="scroll"]').forEach(el => animationObserver.observe(el));
  }
  watchAnimations();

  function getElementInfo(el) {
    const previousMarker = el.style.getPropertyValue('--he-selected-left');
    if (previousMarker) el.style.removeProperty('--he-selected-left');
    const cs = getComputedStyle(el);
    const inline = el.style;
    const get = (prop, parse) => {
      const v = inline[prop] || cs[prop];
      return parse ? parse(v) : v;
    };
    const info = {
      tag: el.tagName.toLowerCase(),
      text: el.textContent || '',
      directText: getDirectText(el),
      hasChildren: el.children.length > 0,
      html: el.innerHTML || '',
      outerHTML: el.outerHTML || '',
      classList: Array.from(el.classList).filter(c => c !== 'he-animate-in-view').join(' '),
      idAttr: el.id || '',
      hrefAttr: el.getAttribute('href') || '',
      targetAttr: el.getAttribute('target') || '',
      srcAttr: el.getAttribute('src') || '',
      altAttr: el.getAttribute('alt') || '',
      titleAttr: el.getAttribute('title') || '',
      roleAttr: el.getAttribute('role') || '',
      ariaLabelAttr: el.getAttribute('aria-label') || '',
      lockedAttr: el.getAttribute('data-he-locked') || '',
      isCodepen: el.hasAttribute('data-he-codepen'),
      codepenHtmlAttr: el.getAttribute('data-codepen-html') || '',
      codepenCssAttr: el.getAttribute('data-codepen-css') || '',
      codepenJsAttr: el.getAttribute('data-codepen-js') || '',
      fullCode: buildFullCode(el),
      fullCodeParts: buildFullCodeParts(el),
      styles: {
        color: rgbToHex(cs.color),
        backgroundColor: rgbToHex(cs.backgroundColor),
        backgroundImage: cs.backgroundImage === 'none' ? '' : cs.backgroundImage,
        background: inline.background || '',
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        textAlign: cs.textAlign,
        paddingTop: cs.paddingTop,
        paddingRight: cs.paddingRight,
        paddingBottom: cs.paddingBottom,
        paddingLeft: cs.paddingLeft,
        marginTop: cs.marginTop,
        marginRight: cs.marginRight,
        marginBottom: cs.marginBottom,
        marginLeft: cs.marginLeft,
        borderRadius: cs.borderRadius,
        display: cs.display,
        lineHeight: cs.lineHeight,
        width: cs.width,
        maxWidth: cs.maxWidth,
        height: cs.height,
        opacity: cs.opacity,
        gap: cs.gap,
        justifyContent: cs.justifyContent,
        alignItems: cs.alignItems,
        gridTemplateColumns: cs.gridTemplateColumns,
        borderWidth: cs.borderTopWidth,
        borderStyle: cs.borderTopStyle,
        borderColor: rgbToHex(cs.borderTopColor),
        position: cs.position,
        zIndex: cs.zIndex,
        top: cs.top,
        right: cs.right,
        bottom: cs.bottom,
        left: cs.left,
        boxShadow: cs.boxShadow === 'none' ? '' : cs.boxShadow,
        textShadow: cs.textShadow === 'none' ? '' : cs.textShadow,
        animationName: cs.animationName === 'none' ? '' : cs.animationName,
        animationDuration: cs.animationDuration,
        animationDelay: cs.animationDelay,
        animationTimingFunction: cs.animationTimingFunction,
        animationIterationCount: cs.animationIterationCount,
        animationDirection: cs.animationDirection,
        animationFillMode: cs.animationFillMode,
      },
      animationTriggerAttr: el.getAttribute('data-he-animation-trigger') || 'load',
      loopAnimationAttr: el.getAttribute('data-he-loop-animation') || '',
      loopDurationAttr: el.getAttribute('data-he-loop-duration') || '',
      loopEasingAttr: el.getAttribute('data-he-loop-easing') || '',
      inlineStyle: el.getAttribute('style') || ''
    };
    if (previousMarker) el.style.setProperty('--he-selected-left', previousMarker);
    return info;
  }

  function getDirectText(el) {
    return Array.from(el.childNodes)
      .filter(n => n.nodeType === Node.TEXT_NODE)
      .map(n => n.textContent)
      .join('')
      .trim();
  }

  function cleanEditorClone(node, classMap = null) {
    const all = node.nodeType === 1 ? [node, ...Array.from(node.querySelectorAll?.('*') || [])] : Array.from(node.querySelectorAll?.('*') || []);
    all.forEach(el => {
      const heId = el.getAttribute('data-he-id');
      if (classMap && heId && classMap.has(heId)) el.classList.add(classMap.get(heId));
      el.removeAttribute('data-he-id');
      el.removeAttribute('data-he-hover');
      el.removeAttribute('data-he-selected');
      el.removeAttribute('data-he-tag');
      el.removeAttribute('data-he-drop');
      el.removeAttribute('data-he-dragging');
      el.removeAttribute('data-he-container');
      el.removeAttribute('data-he-locked');
      if (el.getAttribute('draggable') === 'true') el.removeAttribute('draggable');
      el.classList?.remove('he-animate-in-view', 'he-animation-preview');
      if (el.getAttribute('style')?.includes('--he-selected-left')) el.style.removeProperty('--he-selected-left');
    });
    node.querySelectorAll?.('[data-he-ui]').forEach(el => el.remove());
    node.querySelectorAll?.('[data-he-codepen]').forEach(el => {
      const frame = el.querySelector('iframe');
      if (frame) frame.setAttribute('srcdoc', codepenDoc(el.getAttribute('data-codepen-html') || '', el.getAttribute('data-codepen-css') || '', el.getAttribute('data-codepen-js') || ''));
    });
    if (node.matches?.('[data-he-codepen]')) {
      const frame = node.querySelector('iframe');
      if (frame) frame.setAttribute('srcdoc', codepenDoc(node.getAttribute('data-codepen-html') || '', node.getAttribute('data-codepen-css') || '', node.getAttribute('data-codepen-js') || ''));
    }
  }

  function collectRelatedCss(el, classMap = null) {
    const ids = new Set(Array.from(el.querySelectorAll('[data-he-id]')).map(n => n.getAttribute('data-he-id')));
    if (el.hasAttribute('data-he-id')) ids.add(el.getAttribute('data-he-id'));
    const styles = [];
    document.querySelectorAll('style').forEach(styleEl => {
      if (styleEl.id === '__he_editor_styles' || styleEl.id === '__he_animation_styles') return;
      if (styleEl.id === 'he-global-css' || styleEl.id === 'he-color-vars') styles.push(styleEl.textContent || '');
      if (styleEl.id?.startsWith('he-pseudo-') || styleEl.id?.startsWith('he-responsive-')) {
        const id = styleEl.id.replace(/^he-(pseudo|responsive)-/, '');
        if (ids.has(id)) {
          let css = styleEl.textContent || '';
          if (classMap && classMap.has(id)) css = css.replaceAll('[data-he-id="' + id + '"]', '.' + classMap.get(id));
          styles.push(css);
        }
      }
    });
    const animNames = new Set();
    [el, ...Array.from(el.querySelectorAll('*'))].forEach(n => {
      const name = getComputedStyle(n).animationName;
      if (name && name !== 'none') animNames.add(name);
    });
    if (animNames.size) {
      const sheet = Array.from(document.styleSheets).find(s => s.ownerNode?.id === '__he_animation_styles');
      try {
        Array.from(sheet?.cssRules || []).forEach(rule => {
          if (rule.type === CSSRule.KEYFRAMES_RULE && animNames.has(rule.name)) styles.push(rule.cssText);
        });
      } catch {}
    }
    return styles.filter(Boolean).join('\\n\\n');
  }

  function collectPageCss() {
    return Array.from(document.querySelectorAll('style'))
      .filter(styleEl => styleEl.id !== '__he_editor_styles')
      .map(styleEl => styleEl.textContent || '')
      .filter(Boolean)
      .join('\\n\\n');
  }

  function collectPageLinks() {
    return Array.from(document.querySelectorAll('link[rel="stylesheet"], link[rel="preconnect"], link[rel="preload"]'))
      .map(link => link.outerHTML)
      .join('\\n');
  }

  function collectPageJs() {
    return Array.from(document.querySelectorAll('script'))
      .filter(script => script.id !== '__he_editor_script')
      .map(script => script.src ? script.outerHTML : (script.textContent || ''))
      .filter(Boolean)
      .join('\\n\\n');
  }

  function collectRelatedJs(el) {
    const scripts = [];
    if (el.closest('[data-he-carousel]') || el.querySelector('[data-he-carousel]')) {
      scripts.push(document.getElementById('__he_carousel_runtime')?.textContent || '');
    }
    if (el.querySelector('[data-he-animation-trigger="scroll"], [data-he-animation-trigger="hover"]') || el.matches?.('[data-he-animation-trigger="scroll"], [data-he-animation-trigger="hover"]')) {
      scripts.push(document.getElementById('__he_animation_runtime')?.textContent || '');
    }
    el.querySelectorAll('[data-he-codepen]').forEach(n => {
      const js = n.getAttribute('data-codepen-js') || '';
      if (js) scripts.push(js);
    });
    if (el.hasAttribute('data-he-codepen')) {
      const js = el.getAttribute('data-codepen-js') || '';
      if (js) scripts.push(js);
    }
    return scripts.filter(Boolean).join('\\n\\n');
  }

  function nearestSection(el) {
    return el.closest('section, header, footer, main, article, aside, nav') || el;
  }

  function buildClassMap(el) {
    const map = new Map();
    [el, ...Array.from(el.querySelectorAll('*'))].forEach((node, index) => {
      const id = node.getAttribute('data-he-id');
      if (id) map.set(id, 'he-copy-' + index.toString(36));
    });
    return map;
  }

  function buildFullCodeParts(el) {
    const section = nearestSection(el);
    const htmlClone = section.cloneNode(true);
    cleanEditorClone(htmlClone, null);
    const links = collectPageLinks();
    const css = collectPageCss();
    const js = collectPageJs();
    return { html: htmlClone.outerHTML, css, js, links };
  }

  function buildFullCode(el) {
    const parts = buildFullCodeParts(el);
    return (parts.links ? '<!-- LINKS -->\\n' + parts.links + '\\n\\n' : '') +
      '<!-- HTML -->\\n' + parts.html +
      (parts.css ? '\\n\\n<!-- CSS -->\\n<style>\\n' + parts.css + '\\n</style>' : '') +
      (parts.js ? '\\n\\n<!-- JS -->\\n<script>\\n' + parts.js + '\\n<\\/script>' : '');
  }

  function postChange(el) {
    tagAll(document.body);
    sendTree();
    if (el && el.isConnected) {
      parent.postMessage({
        type: 'he:select',
        id: el.getAttribute('data-he-id'),
        tag: el.tagName.toLowerCase(),
        info: getElementInfo(el)
      }, '*');
    }
    parent.postMessage({ type: 'he:changed' }, '*');
  }

  function rgbToHex(rgb) {
    if (!rgb || rgb === 'transparent' || rgb === 'rgba(0, 0, 0, 0)') return 'transparent';
    const m = rgb.match(/\\d+/g);
    if (!m || m.length < 3) return rgb;
    return '#' + m.slice(0, 3).map(x => parseInt(x).toString(16).padStart(2, '0')).join('').toUpperCase();
  }

  function buildTree(node, depth = 0) {
    if (!node || depth > 30) return null;
    if (node.nodeType !== 1) return null;
    if (!node.hasAttribute || !node.hasAttribute('data-he-id')) return null;
    const tag = node.tagName.toLowerCase();
    if (tag === 'script' || tag === 'style' || tag === 'link' || tag === 'meta') return null;
    const item = {
      id: node.getAttribute('data-he-id'),
      tag: tag,
      label: getLabel(node),
      breadcrumb: getBreadcrumb(node),
      children: []
    };
    Array.from(node.children).forEach(child => {
      const c = buildTree(child, depth + 1);
      if (c) item.children.push(c);
    });
    return item;
  }

  function getLabel(node) {
    if (node.children.length === 0) {
      const t = (node.textContent || '').trim().slice(0, 28);
      if (t) return t;
    }
    if (node.id) return '#' + node.id;
    if (node.className && typeof node.className === 'string') {
      const c = node.className.split(' ').filter(x => x && !x.startsWith('he-'))[0];
      if (c) return '.' + c;
    }
    return node.tagName.toLowerCase();
  }

  function getBreadcrumb(node) {
    const parts = [];
    let n = node;
    while (n && n.nodeType === 1 && n !== document.documentElement) {
      parts.unshift(getLabel(n));
      n = n.parentElement;
    }
    return parts.join(' / ');
  }

  function sendTree() {
    const tree = buildTree(document.body);
    parent.postMessage({ type: 'he:tree', tree: tree }, '*');
  }

  // listener pra comandos vindo do parent
  window.addEventListener('message', (e) => {
    const msg = e.data || {};
    if (!msg || !msg.type || !msg.type.startsWith('he:')) return;

    if (msg.type === 'he:externalDrag') {
      externalInsertHTML = msg.html || '';
    }
    if (msg.type === 'he:externalPointer') {
      if (msg.active) previewExternalPointer(msg.x, msg.y);
      else clearDrop();
    }
    if (msg.type === 'he:cmd:insertAtPoint') {
      insertHTMLAtPoint(msg.html, msg.x, msg.y);
    }
    if (msg.type === 'he:cmd:insertAtViewportCenter') {
      insertHTMLAtPoint(msg.html, window.innerWidth / 2, window.innerHeight / 2);
    }
    if (msg.type === 'he:cmd:setSeo') {
      document.title = msg.title || document.title;
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'description');
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', msg.description || '');
      parent.postMessage({ type: 'he:changed' }, '*');
    }
    if (msg.type === 'he:cmd:setGlobalCss') {
      upsertStyle('he-global-css', msg.css || '');
      parent.postMessage({ type: 'he:changed' }, '*');
    }
    if (msg.type === 'he:cmd:setGoogleFont') {
      const family = msg.family || 'Inter';
      let link = document.querySelector('#he-google-font');
      if (!link) {
        link = document.createElement('link');
        link.id = 'he-google-font';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
      }
      link.href = 'https://fonts.googleapis.com/css2?family=' + encodeURIComponent(family).replace(/%20/g, '+') + ':wght@300;400;500;600;700;800;900&display=swap';
      document.body.style.setProperty('font-family', "'" + family + "', sans-serif", 'important');
      parent.postMessage({ type: 'he:changed' }, '*');
    }
    if (msg.type === 'he:cmd:setColorVars') {
      upsertStyle('he-color-vars', ':root{--he-primary:' + (msg.primary || '#6D71F0') + ';--he-secondary:' + (msg.secondary || '#2BBF88') + ';}');
      parent.postMessage({ type: 'he:changed' }, '*');
    }
    if (msg.type === 'he:cmd:setFavicon') {
      let link = document.querySelector('link[rel="icon"]');
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = msg.href || '';
      parent.postMessage({ type: 'he:changed' }, '*');
    }
    if (msg.type === 'he:cmd:copySectionFullCode') {
      const el = getEl(msg.id);
      if (el) {
        const section = nearestSection(el);
        const htmlClone = section.cloneNode(true);
        cleanEditorClone(htmlClone);
        const css = collectRelatedCss(section);
        const js = collectRelatedJs(section);
        const code = '<!-- HTML -->\\n' + htmlClone.outerHTML +
          (css ? '\\n\\n<!-- CSS -->\\n<style>\\n' + css + '\\n</style>' : '') +
          (js ? '\\n\\n<!-- JS -->\\n<script>\\n' + js + '\\n<\\/script>' : '');
        parent.postMessage({ type: 'he:copyFullCode', code }, '*');
      }
    }

    if (msg.type === 'he:cmd:setText') {
      const el = getEl(msg.id);
      if (el) {
        el.textContent = msg.text;
        postChange(el);
        watchAnimations();
      }
    }
    if (msg.type === 'he:cmd:setHtml') {
      const el = getEl(msg.id);
      if (el) {
        el.innerHTML = msg.html;
        tagAll(el);
        postChange(el);
      }
    }
    if (msg.type === 'he:cmd:setOuterHTML') {
      const el = getEl(msg.id);
      if (el && el !== document.body) {
        const wrap = document.createElement('div');
        wrap.innerHTML = msg.html || '';
        const node = wrap.firstElementChild;
        if (!node) return;
        el.replaceWith(node);
        tagAll(document.body);
        markSelected(node);
        postChange(node);
      }
    }
    if (msg.type === 'he:cmd:setStyle') {
      const el = getEl(msg.id);
      if (el) {
        const beforeRect = el.getBoundingClientRect();
        const beforeOffsetParent = el.offsetParent || document.body;
        const beforeParentRect = beforeOffsetParent.getBoundingClientRect();
        Object.entries(msg.styles).forEach(([k, v]) => {
          const prop = camelToKebab(k);
          if (v === '' || v === null || v === undefined) {
            el.style.removeProperty(prop);
          } else {
            el.style.setProperty(prop, String(v), 'important');
          }
        });
        if (Object.prototype.hasOwnProperty.call(msg.styles, 'position')) {
          const nextPosition = msg.styles.position;
          if (nextPosition === 'fixed') {
            el.style.setProperty('top', Math.round(beforeRect.top) + 'px', 'important');
            el.style.setProperty('left', Math.round(beforeRect.left) + 'px', 'important');
            el.style.removeProperty('right');
            el.style.removeProperty('bottom');
          }
          if (nextPosition === 'absolute') {
            el.style.setProperty('top', Math.round(beforeRect.top - beforeParentRect.top) + 'px', 'important');
            el.style.setProperty('left', Math.round(beforeRect.left - beforeParentRect.left) + 'px', 'important');
            el.style.removeProperty('right');
            el.style.removeProperty('bottom');
          }
          if (nextPosition === 'sticky') {
            el.style.setProperty('top', el.style.top && el.style.top !== 'auto' ? el.style.top : '0px', 'important');
            el.style.removeProperty('left');
            el.style.removeProperty('right');
            el.style.removeProperty('bottom');
          }
          if (!nextPosition) {
            ['top', 'right', 'bottom', 'left', 'z-index'].forEach(prop => el.style.removeProperty(prop));
          }
        }
        postChange(el);
        watchAnimations();
      }
    }
    if (msg.type === 'he:cmd:setAttr') {
      const el = getEl(msg.id);
      if (el) {
        if (msg.value === '' || msg.value === null) el.removeAttribute(msg.name);
        else el.setAttribute(msg.name, msg.value);
        if (msg.name && msg.name.startsWith('data-codepen-')) renderCodepens(document);
        postChange(el);
        watchAnimations();
      }
    }
    if (msg.type === 'he:cmd:wrapLink') {
      const el = getEl(msg.id);
      if (el) {
        let link = el.tagName === 'A' ? el : null;
        if (!link) {
          link = document.createElement('a');
          el.parentElement.insertBefore(link, el);
          link.appendChild(el);
          tagAll(link);
        }
        link.setAttribute('href', msg.href || '#');
        if (msg.target) link.setAttribute('target', msg.target);
        else link.removeAttribute('target');
        markSelected(link);
        postChange(link);
      }
    }
    if (msg.type === 'he:cmd:unwrapLink') {
      const el = getEl(msg.id);
      const link = el?.tagName === 'A' ? el : el?.closest('a');
      if (link && link.parentElement) {
        const parentEl = link.parentElement;
        while (link.firstChild) parentEl.insertBefore(link.firstChild, link);
        link.remove();
        tagAll(parentEl);
        postChange(parentEl);
      }
    }
    if (msg.type === 'he:cmd:setPseudoCss') {
      const el = getEl(msg.id);
      if (el) {
        const id = el.getAttribute('data-he-id');
        const hover = msg.hover ? '[data-he-id="' + id + '"]:hover{' + msg.hover + '}' : '';
        const focus = msg.focus ? '[data-he-id="' + id + '"]:focus{' + msg.focus + '}' : '';
        upsertStyle('he-pseudo-' + id, hover + focus);
        parent.postMessage({ type: 'he:changed' }, '*');
      }
    }
    if (msg.type === 'he:cmd:setResponsiveCss') {
      const el = getEl(msg.id);
      if (el) {
        const id = el.getAttribute('data-he-id');
        const tablet = msg.tablet ? '@media(max-width:1024px){[data-he-id="' + id + '"]{' + msg.tablet + '}}' : '';
        const mobile = msg.mobile ? '@media(max-width:480px){[data-he-id="' + id + '"]{' + msg.mobile + '}}' : '';
        upsertStyle('he-responsive-' + id, tablet + mobile);
        parent.postMessage({ type: 'he:changed' }, '*');
      }
    }
    if (msg.type === 'he:cmd:align') {
      const el = getEl(msg.id);
      if (el) {
        el.style.setProperty('position', getComputedStyle(el).position === 'static' ? 'relative' : getComputedStyle(el).position, 'important');
        if (msg.align === 'center-x') {
          el.style.setProperty('left', '50%', 'important');
          el.style.setProperty('transform', 'translateX(-50%)', 'important');
        }
        if (msg.align === 'center-y') {
          el.style.setProperty('top', '50%', 'important');
          el.style.setProperty('transform', 'translateY(-50%)', 'important');
        }
        if (msg.align === 'center') {
          el.style.setProperty('left', '50%', 'important');
          el.style.setProperty('top', '50%', 'important');
          el.style.setProperty('transform', 'translate(-50%, -50%)', 'important');
        }
        postChange(el);
      }
    }
    if (msg.type === 'he:cmd:previewAnimation') {
      const el = getEl(msg.id);
      if (el) {
        el.classList.remove('he-animation-preview');
        void el.offsetWidth;
        el.classList.add('he-animation-preview');
        requestAnimationFrame(() => {
          el.classList.remove('he-animation-preview');
        });
      }
    }
    if (msg.type === 'he:cmd:setClass') {
      const el = getEl(msg.id);
      if (el) {
        el.className = msg.value;
        postChange(el);
      }
    }
    if (msg.type === 'he:cmd:delete') {
      const el = getEl(msg.id);
      if (el && el !== document.body) {
        el.remove();
        clearMarkers('data-he-selected');
        document.querySelectorAll('[style*="--he-selected-left"]').forEach(n => n.style.removeProperty('--he-selected-left'));
        parent.postMessage({ type: 'he:select', id: null, info: null }, '*');
        parent.postMessage({ type: 'he:changed' }, '*');
      }
      sendTree();
    }
    if (msg.type === 'he:cmd:duplicate') {
      const el = getEl(msg.id);
      if (el && el.parentElement) {
        const clone = el.cloneNode(true);
        // reatribuir data-he-id em todos os filhos do clone
        clone.querySelectorAll('[data-he-id]').forEach(n => n.setAttribute('data-he-id', genId()));
        clone.setAttribute('data-he-id', genId());
        el.parentElement.insertBefore(clone, el.nextSibling);
        postChange(clone);
      }
    }
    if (msg.type === 'he:cmd:move') {
      const el = getEl(msg.id);
      if (!el || !el.parentElement) return;
      if (msg.dir === 'up' && el.previousElementSibling) {
        el.parentElement.insertBefore(el, el.previousElementSibling);
      }
      if (msg.dir === 'down' && el.nextElementSibling) {
        el.parentElement.insertBefore(el.nextElementSibling, el);
      }
      postChange(el);
    }
    if (msg.type === 'he:cmd:insert') {
      const target = msg.targetId ? getEl(msg.targetId) : document.body;
      const wrap = document.createElement('div');
      wrap.innerHTML = msg.html;
      const node = wrap.firstElementChild;
      if (!node) return;
      tagAll(wrap);
      node.setAttribute('data-he-id', genId());
      if (msg.position === 'inside' && target) {
        target.appendChild(node);
      } else if (target && target.parentElement) {
        target.parentElement.insertBefore(node, target.nextSibling);
      } else {
        document.body.appendChild(node);
      }
      sendTree();
      // seleciona o novo
      markSelected(node);
      parent.postMessage({
        type: 'he:select',
        id: node.getAttribute('data-he-id'),
        tag: node.tagName.toLowerCase(),
        info: getElementInfo(node)
      }, '*');
      parent.postMessage({ type: 'he:changed' }, '*');
    }
    if (msg.type === 'he:cmd:select') {
      if (!msg.id) {
        selectedId = null;
        clearMarkers('data-he-selected');
        return;
      }
      const el = getEl(msg.id);
      if (el) {
        markSelected(el);
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        parent.postMessage({
          type: 'he:select',
          id: el.getAttribute('data-he-id'),
          tag: el.tagName.toLowerCase(),
          info: getElementInfo(el)
        }, '*');
      }
    }
    if (msg.type === 'he:cmd:requestExport') {
      // remove markers e atributos do editor antes de exportar
      const clone = document.documentElement.cloneNode(true);
      clone.querySelectorAll('[data-he-id]').forEach(el => el.removeAttribute('data-he-id'));
      clone.querySelectorAll('[data-he-hover]').forEach(el => el.removeAttribute('data-he-hover'));
      clone.querySelectorAll('[data-he-selected]').forEach(el => el.removeAttribute('data-he-selected'));
      clone.querySelectorAll('[data-he-tag]').forEach(el => el.removeAttribute('data-he-tag'));
      clone.querySelectorAll('[data-he-drop]').forEach(el => el.removeAttribute('data-he-drop'));
      clone.querySelectorAll('[data-he-dragging]').forEach(el => el.removeAttribute('data-he-dragging'));
      clone.querySelectorAll('[data-he-container]').forEach(el => el.removeAttribute('data-he-container'));
      clone.querySelectorAll('[data-he-locked]').forEach(el => el.removeAttribute('data-he-locked'));
      clone.querySelectorAll('[data-he-ui]').forEach(el => el.remove());
      clone.querySelectorAll('#__he_resize_handle').forEach(el => el.remove());
      clone.querySelectorAll('[data-he-codepen]').forEach(el => {
        const frame = el.querySelector('iframe');
        if (frame) frame.setAttribute('srcdoc', codepenDoc(el.getAttribute('data-codepen-html') || '', el.getAttribute('data-codepen-css') || '', el.getAttribute('data-codepen-js') || ''));
      });
      clone.querySelectorAll('[draggable="true"]').forEach(el => el.removeAttribute('draggable'));
      clone.querySelectorAll('.he-animate-in-view').forEach(el => el.classList.remove('he-animate-in-view'));
      clone.querySelectorAll('.he-animation-preview').forEach(el => el.classList.remove('he-animation-preview'));
      clone.querySelectorAll('[style*="--he-selected-left"]').forEach(el => el.style.removeProperty('--he-selected-left'));
      if (msg.cleanClasses) {
        clone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
        clone.querySelectorAll('[class]').forEach(el => el.removeAttribute('class'));
      }
      const styleEl = clone.querySelector('#__he_editor_styles');
      if (styleEl) styleEl.remove();
      const scriptEl = clone.querySelector('#__he_editor_script');
      if (scriptEl) scriptEl.remove();
      parent.postMessage({
        type: 'he:exported',
        html: '<!DOCTYPE html>\\n' + clone.outerHTML
      }, '*');
    }
    if (msg.type === 'he:cmd:requestInfo') {
      const el = getEl(msg.id);
      if (el) parent.postMessage({
        type: 'he:select',
        id: msg.id,
        tag: el.tagName.toLowerCase(),
        info: getElementInfo(el)
      }, '*');
    }
  });

  function camelToKebab(s) { return s.replace(/[A-Z]/g, m => '-' + m.toLowerCase()); }

  // pronto
  sendTree();
  parent.postMessage({ type: 'he:ready' }, '*');
})();
`

// injeta o script no HTML do usuário antes de carregar no iframe
export function injectBridge(html) {
  const scriptTag = `<script id="__he_editor_script">${IFRAME_BRIDGE_SCRIPT}</script>`
  // tenta inserir antes de </body>; se não tiver, antes de </html>; se nada, append
  if (html.includes('</body>')) {
    return html.replace('</body>', `${scriptTag}</body>`)
  }
  if (html.includes('</html>')) {
    return html.replace('</html>', `${scriptTag}</html>`)
  }
  return html + scriptTag
}

// garante que o HTML tenha estrutura básica
export function normalizeHTML(rawHTML) {
  const trimmed = rawHTML.trim()
  const parted = parseCopiedCodeParts(trimmed)
  if (parted) return parted
  if (trimmed.toLowerCase().startsWith('<!doctype') || trimmed.toLowerCase().startsWith('<html')) {
    return trimmed
  }
  // wrap em estrutura básica
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Documento</title>
</head>
<body>
${trimmed}
</body>
</html>`
}

function parseCopiedCodeParts(raw) {
  const htmlMatch = raw.match(/<!--\s*HTML\s*-->([\s\S]*?)(?=<!--\s*CSS\s*-->|<!--\s*JS\s*-->|$)/i)
  const cssMatch = raw.match(/<!--\s*CSS\s*-->([\s\S]*?)(?=<!--\s*JS\s*-->|$)/i)
  const jsMatch = raw.match(/<!--\s*JS\s*-->([\s\S]*)$/i)
  if (!htmlMatch && !cssMatch && !jsMatch) return null
  const html = stripWrapper(htmlMatch?.[1] || '', 'style').trim()
  const css = stripWrapper(cssMatch?.[1] || '', 'style').trim()
  const js = cleanImportedJS(stripWrapper(jsMatch?.[1] || '', 'script')).trim()
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Documento</title>
${css ? `<style>\n${css}\n</style>` : ''}
</head>
<body>
${html}
${js ? `<script>\n${js}\n</script>` : ''}
</body>
</html>`
}

function stripWrapper(code, tag) {
  return String(code || '')
    .replace(new RegExp('^\\s*<' + tag + '[^>]*>', 'i'), '')
    .replace(new RegExp('</' + tag + '>\\s*$', 'i'), '')
}

function cleanImportedJS(code) {
  const text = String(code || '').trim()
  if (!text.startsWith('{')) return text
  let depth = 0
  let inString = false
  let quote = ''
  let escaped = false
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i]
    if (inString) {
      if (escaped) escaped = false
      else if (ch === '\\') escaped = true
      else if (ch === quote) inString = false
      continue
    }
    if (ch === '"' || ch === "'") {
      inString = true
      quote = ch
      continue
    }
    if (ch === '{') depth += 1
    if (ch === '}') depth -= 1
    if (depth === 0) {
      const rest = text.slice(i + 1).trim()
      return rest || ''
    }
  }
  return text
}

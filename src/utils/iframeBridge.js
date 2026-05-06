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
  let dropState = null;
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
  }

  function isContainer(el) {
    if (!el || !el.tagName) return false;
    if (CONTAINER_TAGS.includes(el.tagName)) return true;
    return el.tagName === 'DIV' && el.children.length > 0;
  }

  tagAll(document.body);

  // estilos do editor
  const style = document.createElement('style');
  style.id = '__he_editor_styles';
  style.textContent = \`
    [data-he-hover] { outline: 2px dashed #6d71f0 !important; outline-offset: -2px; cursor: pointer !important; }
    [data-he-selected] { outline: 2px solid #6d71f0 !important; outline-offset: -2px; position: relative; }
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

  function getEl(id) { return document.querySelector('[data-he-id="' + id + '"]'); }

  function clearMarkers(attr) {
    document.querySelectorAll('[' + attr + ']').forEach(el => el.removeAttribute(attr));
    if (attr === 'data-he-selected') {
      document.querySelectorAll('[style*="--he-selected-left"]').forEach(el => el.style.removeProperty('--he-selected-left'));
    }
  }

  function markSelected(el) {
    clearMarkers('data-he-selected');
    el.setAttribute('data-he-selected', '');
    el.setAttribute('data-he-tag', el.tagName.toLowerCase());
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--he-selected-left', Math.round(rect.left) + 'px');
  }

  function canDrop(dragged, target) {
    if (!dragged || !target || dragged === target) return false;
    if (dragged === document.body) return false;
    return !dragged.contains(target);
  }

  function clearDrop() {
    clearMarkers('data-he-drop');
    dropLine.style.display = 'none';
    dropState = null;
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

  document.addEventListener('dragstart', (e) => {
    if (e.target.closest('[data-he-ui]')) return;
    const el = e.target.closest('[data-he-id]');
    if (!el || el === document.body) return;
    draggedId = el.getAttribute('data-he-id');
    hideInsertButton();
    el.setAttribute('data-he-dragging', '');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', draggedId);
  }, true);

  document.addEventListener('dragover', (e) => {
    const target = e.target.closest('[data-he-id]');
    const dragged = getEl(draggedId);
    if (!canDrop(dragged, target)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    clearDrop();
    dropState = getDropState(e, target);
    showDropLine(dropState);
  }, true);

  document.addEventListener('drop', (e) => {
    const target = e.target.closest('[data-he-id]');
    const dragged = getEl(draggedId);
    clearDrop();
    if (!canDrop(dragged, target)) return;
    e.preventDefault();
    const state = dropState || getDropState(e, target);
    if (state.before && target.parentElement) target.parentElement.insertBefore(dragged, target);
    else if (target.parentElement) target.parentElement.insertBefore(dragged, target.nextSibling);
    dragged.removeAttribute('data-he-dragging');
    markSelected(dragged);
    postChange(dragged);
  }, true);

  document.addEventListener('dragend', () => {
    const dragged = getEl(draggedId);
    if (dragged) dragged.removeAttribute('data-he-dragging');
    draggedId = null;
    clearDrop();
  }, true);

  // intercepta cliques em links pra evitar navegação
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-he-ui]')) return;
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
      classList: Array.from(el.classList).join(' '),
      idAttr: el.id || '',
      hrefAttr: el.getAttribute('href') || '',
      srcAttr: el.getAttribute('src') || '',
      altAttr: el.getAttribute('alt') || '',
      titleAttr: el.getAttribute('title') || '',
      roleAttr: el.getAttribute('role') || '',
      ariaLabelAttr: el.getAttribute('aria-label') || '',
      styles: {
        color: rgbToHex(cs.color),
        backgroundColor: rgbToHex(cs.backgroundColor),
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
        boxShadow: cs.boxShadow === 'none' ? '' : cs.boxShadow,
      },
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

  function sendTree() {
    const tree = buildTree(document.body);
    parent.postMessage({ type: 'he:tree', tree: tree }, '*');
  }

  // listener pra comandos vindo do parent
  window.addEventListener('message', (e) => {
    const msg = e.data || {};
    if (!msg || !msg.type || !msg.type.startsWith('he:')) return;

    if (msg.type === 'he:cmd:setText') {
      const el = getEl(msg.id);
      if (el) {
        el.textContent = msg.text;
        postChange(el);
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
    if (msg.type === 'he:cmd:setStyle') {
      const el = getEl(msg.id);
      if (el) {
        Object.entries(msg.styles).forEach(([k, v]) => {
          if (v === '' || v === null || v === undefined) el.style.removeProperty(camelToKebab(k));
          else el.style[k] = v;
        });
        postChange(el);
      }
    }
    if (msg.type === 'he:cmd:setAttr') {
      const el = getEl(msg.id);
      if (el) {
        if (msg.value === '' || msg.value === null) el.removeAttribute(msg.name);
        else el.setAttribute(msg.name, msg.value);
        postChange(el);
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
      if (!msg.id) return;
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
      clone.querySelectorAll('[data-he-ui]').forEach(el => el.remove());
      clone.querySelectorAll('[draggable="true"]').forEach(el => el.removeAttribute('draggable'));
      clone.querySelectorAll('[style*="--he-selected-left"]').forEach(el => el.style.removeProperty('--he-selected-left'));
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

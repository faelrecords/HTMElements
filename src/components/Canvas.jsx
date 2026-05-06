import { useEffect, useRef } from 'react'
import { Monitor, Tablet, Smartphone } from 'lucide-react'
import { useEditorStore } from '../store/editorStore'
import { injectBridge } from '../utils/iframeBridge'

export default function Canvas({ iframeRef }) {
  const loadedHTML = useEditorStore(s => s.loadedHTML)
  const reloadKey = useEditorStore(s => s.reloadKey)
  const device = useEditorStore(s => s.device)
  const setDevice = useEditorStore(s => s.setDevice)
  const setSelected = useEditorStore(s => s.setSelected)
  const setHovered = useEditorStore(s => s.setHovered)
  const setTreeData = useEditorStore(s => s.setTreeData)
  const setHTML = useEditorStore(s => s.setHTML)
  const blobUrlRef = useRef(null)

  // monta o iframe quando o HTML deve ser recarregado
  useEffect(() => {
    if (!loadedHTML || !iframeRef.current) return
    const html = injectBridge(loadedHTML)
    const blob = new Blob([html], { type: 'text/html' })
    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current)
    blobUrlRef.current = URL.createObjectURL(blob)
    iframeRef.current.src = blobUrlRef.current
    return () => {
      // cleanup tratado em ciclos seguintes
    }
  }, [reloadKey, iframeRef])

  // listener de reload via undo/redo
  useEffect(() => {
    function reload(e) {
      const html = e.detail?.html
      if (!html || !iframeRef.current) return
      const wrapped = injectBridge(html)
      const blob = new Blob([wrapped], { type: 'text/html' })
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current)
      blobUrlRef.current = URL.createObjectURL(blob)
      iframeRef.current.src = blobUrlRef.current
    }
    window.addEventListener('he:reloadIframe', reload)
    return () => window.removeEventListener('he:reloadIframe', reload)
  }, [iframeRef])

  // recebe mensagens do iframe
  useEffect(() => {
    function onMsg(e) {
      const m = e.data || {}
      if (!m || !m.type) return
      if (m.type === 'he:select') {
        setSelected(m.id)
      }
      if (m.type === 'he:hover') {
        setHovered(m.id)
      }
      if (m.type === 'he:tree') {
        setTreeData(m.tree)
      }
      if (m.type === 'he:exported') {
        // dispara download
        const blob = new Blob([m.html], { type: 'text/html' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'pagina-editada.html'
        a.click()
        URL.revokeObjectURL(url)
      }
      if (m.type === 'he:ready') {
        // snapshot inicial pra histórico
      }
      // mudanças que afetam o HTML — captura snapshot pra undo
      if (
        m.type === 'he:select' ||
        m.type === 'he:hover'
      ) return
      // ignora os ruídos
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [setSelected, setHovered, setTreeData])

  // captura snapshots apos mudanças reais no iframe
  useEffect(() => {
    let timer = null
    function snapshot() {
      const iframe = iframeRef.current
      if (!iframe || !iframe.contentDocument) return
      const doc = iframe.contentDocument
      const clone = doc.documentElement.cloneNode(true)
      // remove rastros do editor antes de salvar
      clone.querySelectorAll('#__he_editor_script, #__he_editor_styles').forEach(n => n.remove())
      clone.querySelectorAll('[data-he-id]').forEach(el => el.removeAttribute('data-he-id'))
      clone.querySelectorAll('[data-he-hover]').forEach(el => el.removeAttribute('data-he-hover'))
      clone.querySelectorAll('[data-he-selected]').forEach(el => el.removeAttribute('data-he-selected'))
      clone.querySelectorAll('[data-he-tag]').forEach(el => el.removeAttribute('data-he-tag'))
      clone.querySelectorAll('[data-he-drop]').forEach(el => el.removeAttribute('data-he-drop'))
      clone.querySelectorAll('[data-he-dragging]').forEach(el => el.removeAttribute('data-he-dragging'))
      clone.querySelectorAll('[data-he-container]').forEach(el => el.removeAttribute('data-he-container'))
      clone.querySelectorAll('[data-he-ui]').forEach(el => el.remove())
      clone.querySelectorAll('[draggable="true"]').forEach(el => el.removeAttribute('draggable'))
      clone.querySelectorAll('[style*="--he-selected-left"]').forEach(el => el.style.removeProperty('--he-selected-left'))
      const html = '<!DOCTYPE html>\n' + clone.outerHTML
      setHTML(html, { skipHistory: false, skipReload: true })
    }
    function onMsg(e) {
      const m = e.data || {}
      if (m.type !== 'he:changed') return
      clearTimeout(timer)
      timer = setTimeout(snapshot, 180)
    }
    window.addEventListener('message', onMsg)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('message', onMsg)
    }
  }, [setHTML, iframeRef])

  return (
    <main className="canvas-area">
      <div className="canvas-toolbar">
        <button
          className={'canvas-device-btn ' + (device === 'desktop' ? 'active' : '')}
          onClick={() => setDevice('desktop')}
        ><Monitor size={14} /> Desktop</button>
        <button
          className={'canvas-device-btn ' + (device === 'tablet' ? 'active' : '')}
          onClick={() => setDevice('tablet')}
        ><Tablet size={14} /> Tablet</button>
        <button
          className={'canvas-device-btn ' + (device === 'mobile' ? 'active' : '')}
          onClick={() => setDevice('mobile')}
        ><Smartphone size={14} /> Mobile</button>
        <span className="canvas-zoom">{device}</span>
      </div>

      <div className="canvas-frame-wrap">
        <iframe
          ref={iframeRef}
          className={'canvas-frame ' + device}
          title="Editor canvas"
          scrolling="no"
          sandbox="allow-same-origin allow-scripts allow-forms"
        />
      </div>
    </main>
  )
}

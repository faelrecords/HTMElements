import { useRef, useEffect, useCallback } from 'react'
import { useEditorStore } from './store/editorStore'
import { normalizeHTML } from './utils/iframeBridge'
import Topbar from './components/Topbar'
import LeftSidebar from './components/LeftSidebar'
import RightSidebar from './components/RightSidebar'
import Canvas from './components/Canvas'
import WelcomeScreen, { BLANK_HTML } from './components/WelcomeScreen'
import CodePanel from './components/CodePanel'

export default function App() {
  const iframeRef = useRef(null)
  const loadedHTML = useEditorStore(s => s.loadedHTML)
  const notice = useEditorStore(s => s.notice)
  const codeOpen = useEditorStore(s => s.codeOpen)
  const setHTML = useEditorStore(s => s.setHTML)
  const reset = useEditorStore(s => s.reset)

  const handleLoad = useCallback((rawHTML) => {
    const normalized = normalizeHTML(rawHTML)
    reset()
    setHTML(normalized, { skipHistory: true, resetHistory: true })
  }, [setHTML, reset])

  const handleReset = useCallback(() => {
    if (loadedHTML && !confirm('Descartar trabalho atual e carregar outro arquivo?')) return
    reset()
  }, [loadedHTML, reset])

  const handleBlank = useCallback(() => {
    if (loadedHTML && !confirm('Descartar trabalho atual e criar documento em branco?')) return
    reset()
    setHTML(BLANK_HTML, { skipHistory: true, resetHistory: true })
  }, [loadedHTML, reset, setHTML])

  const handlePreview = useCallback(() => {
    const iframe = iframeRef.current
    if (!iframe || !iframe.contentDocument) return
    const doc = iframe.contentDocument
    const clone = doc.documentElement.cloneNode(true)
    clone.querySelectorAll('#__he_editor_script, #__he_editor_styles').forEach(n => n.remove())
    clone.querySelectorAll('[data-he-id]').forEach(el => el.removeAttribute('data-he-id'))
    clone.querySelectorAll('[data-he-hover]').forEach(el => el.removeAttribute('data-he-hover'))
    clone.querySelectorAll('[data-he-selected]').forEach(el => el.removeAttribute('data-he-selected'))
    clone.querySelectorAll('[data-he-tag]').forEach(el => el.removeAttribute('data-he-tag'))
    clone.querySelectorAll('[data-he-drop]').forEach(el => el.removeAttribute('data-he-drop'))
    clone.querySelectorAll('[data-he-dragging]').forEach(el => el.removeAttribute('data-he-dragging'))
    clone.querySelectorAll('[data-he-container]').forEach(el => el.removeAttribute('data-he-container'))
    clone.querySelectorAll('[data-he-locked]').forEach(el => el.removeAttribute('data-he-locked'))
    clone.querySelectorAll('[data-he-ui]').forEach(el => el.remove())
    clone.querySelectorAll('[draggable="true"]').forEach(el => el.removeAttribute('draggable'))
    clone.querySelectorAll('.he-animate-in-view').forEach(el => el.classList.remove('he-animate-in-view'))
    clone.querySelectorAll('.he-animation-preview').forEach(el => el.classList.remove('he-animation-preview'))
    clone.querySelectorAll('[style*="--he-selected-left"]').forEach(el => el.style.removeProperty('--he-selected-left'))
    const html = '<!DOCTYPE html>\n' + clone.outerHTML
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 60000)
  }, [])

  // atalhos de teclado
  useEffect(() => {
    function onKey(e) {
      const meta = e.metaKey || e.ctrlKey
      if (meta && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        const html = useEditorStore.getState().undo()
        if (html !== null) window.dispatchEvent(new CustomEvent('he:reloadIframe', { detail: { html } }))
      }
      if ((meta && e.key === 'y') || (meta && e.shiftKey && e.key === 'Z')) {
        e.preventDefault()
        const html = useEditorStore.getState().redo()
        if (html !== null) window.dispatchEvent(new CustomEvent('he:reloadIframe', { detail: { html } }))
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const tag = e.target?.tagName?.toLowerCase()
        if (tag === 'input' || tag === 'textarea' || tag === 'select') return
        const id = useEditorStore.getState().selectedId
        if (id && iframeRef.current) {
          e.preventDefault()
          iframeRef.current.contentWindow.postMessage({ type: 'he:cmd:delete', id }, '*')
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (!loadedHTML) {
    return <WelcomeScreen onLoad={handleLoad} />
  }

  return (
    <div className="app">
      <Topbar
        iframeRef={iframeRef}
        onReset={handleReset}
        onBlank={handleBlank}
        onPreview={handlePreview}
      />
      <div className="workspace">
        <LeftSidebar iframeRef={iframeRef} />
        <Canvas iframeRef={iframeRef} />
        <RightSidebar iframeRef={iframeRef} />
      </div>
      {codeOpen && <CodePanel />}
      {notice && <div className="notice">{notice}</div>}
    </div>
  )
}

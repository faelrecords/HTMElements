import { Undo2, Redo2, Eye, Download, Upload, FileCode2 } from 'lucide-react'
import { useEditorStore } from '../store/editorStore'

export default function Topbar({ iframeRef, onReset, onPreview }) {
  const historyIndex = useEditorStore(s => s.historyIndex)
  const history = useEditorStore(s => s.history)
  const codeOpen = useEditorStore(s => s.codeOpen)
  const setCodeOpen = useEditorStore(s => s.setCodeOpen)
  const showNotice = useEditorStore(s => s.showNotice)

  const canUndo = historyIndex > 0
  const canRedo = historyIndex < history.length - 1

  function handleUndo() {
    const html = useEditorStore.getState().undo()
    if (html === null) return
    // recarrega o iframe com o HTML restaurado
    window.dispatchEvent(new CustomEvent('he:reloadIframe', { detail: { html } }))
    showNotice('Desfeito')
  }
  function handleRedo() {
    const html = useEditorStore.getState().redo()
    if (html === null) return
    window.dispatchEvent(new CustomEvent('he:reloadIframe', { detail: { html } }))
    showNotice('Refeito')
  }

  function handleExport() {
    const iframe = iframeRef.current
    if (!iframe) return
    iframe.contentWindow.postMessage({ type: 'he:cmd:requestExport' }, '*')
  }

  return (
    <header className="topbar">
      <div className="topbar-section">
        <div className="topbar-logo">
          <div className="topbar-logo-mark">HE</div>
          HTMElements
        </div>
        <span className="topbar-title"> · <strong>editor visual</strong></span>
      </div>

      <div className="topbar-section">
        <button className="btn btn-icon btn-ghost" onClick={handleUndo} disabled={!canUndo} title="Desfazer (Ctrl+Z)">
          <Undo2 size={16} />
        </button>
        <button className="btn btn-icon btn-ghost" onClick={handleRedo} disabled={!canRedo} title="Refazer (Ctrl+Y)">
          <Redo2 size={16} />
        </button>
      </div>

      <div className="topbar-section">
        <button className="btn" onClick={onReset} title="Carregar outro arquivo">
          <Upload size={14} /> Novo
        </button>
        <button className="btn" onClick={onPreview} title="Visualizar resultado">
          <Eye size={14} /> Preview
        </button>
        <button className={'btn ' + (codeOpen ? 'active' : '')} onClick={() => setCodeOpen(!codeOpen)} title="Editar HTML">
          <FileCode2 size={14} /> Código
        </button>
        <button className="btn btn-primary" onClick={handleExport} title="Baixar HTML final">
          <Download size={14} /> Exportar
        </button>
      </div>
    </header>
  )
}

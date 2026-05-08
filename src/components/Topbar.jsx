import { Undo2, Redo2, Eye, Download, Upload, FileCode2, FilePlus2 } from 'lucide-react'
import { useEditorStore } from '../store/editorStore'

export default function Topbar({ iframeRef, onReset, onBlank, onImportCode, onPreview }) {
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
    const cleanClasses = confirm('Remover classes e ids do HTML exportado?')
    iframe.contentWindow.postMessage({ type: 'he:cmd:requestExport', cleanClasses }, '*')
  }

  function handleSEO() {
    const iframe = iframeRef.current
    if (!iframe) return
    const title = prompt('Title da página')
    if (title === null) return
    const description = prompt('Meta description') || ''
    iframe.contentWindow.postMessage({ type: 'he:cmd:setSeo', title, description }, '*')
    showNotice('SEO atualizado')
  }

  function handleGlobalCSS() {
    const iframe = iframeRef.current
    if (!iframe) return
    const css = prompt('CSS global') || ''
    iframe.contentWindow.postMessage({ type: 'he:cmd:setGlobalCss', css }, '*')
    showNotice('CSS global aplicado')
  }

  function handleFont() {
    const family = prompt('Google Font family', 'Inter')
    if (!family) return
    iframeRef.current?.contentWindow?.postMessage({ type: 'he:cmd:setGoogleFont', family }, '*')
    showNotice('Fonte adicionada')
  }

  function handleColors() {
    const primary = prompt('Cor primária', '#6D71F0') || '#6D71F0'
    const secondary = prompt('Cor secundária', '#2BBF88') || '#2BBF88'
    iframeRef.current?.contentWindow?.postMessage({ type: 'he:cmd:setColorVars', primary, secondary }, '*')
    showNotice('Cores globais')
  }

  function handleFavicon() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/svg+xml,image/png,image/x-icon'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        iframeRef.current?.contentWindow?.postMessage({ type: 'he:cmd:setFavicon', href: reader.result }, '*')
        showNotice('Favicon aplicado')
      }
      reader.readAsDataURL(file)
    }
    input.click()
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
        <button className="btn" onClick={onBlank} title="Criar documento em branco">
          <FilePlus2 size={14} /> Branco
        </button>
        <button className="btn" onClick={onImportCode} title="Importar código HTML">
          <FileCode2 size={14} /> Importar
        </button>
        <button className="btn" onClick={onPreview} title="Visualizar resultado">
          <Eye size={14} /> Preview
        </button>
        <button className="btn" onClick={handleSEO} title="Editar SEO">
          SEO
        </button>
        <button className="btn" onClick={handleGlobalCSS} title="CSS global">
          CSS
        </button>
        <button className="btn" onClick={handleFont} title="Google Fonts">
          Fonte
        </button>
        <button className="btn" onClick={handleColors} title="Variáveis de cor">
          Cores
        </button>
        <button className="btn" onClick={handleFavicon} title="Favicon">
          Favicon
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

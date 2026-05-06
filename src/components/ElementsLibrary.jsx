import { ELEMENT_TEMPLATES } from '../utils/elementTemplates'
import { useEditorStore } from '../store/editorStore'

export default function ElementsLibrary({ iframeRef }) {
  const selectedId = useEditorStore(s => s.selectedId)
  const showNotice = useEditorStore(s => s.showNotice)

  function insert(html) {
    const iframe = iframeRef.current
    if (!iframe) return
    iframe.contentWindow.postMessage({
      type: 'he:cmd:insert',
      html: html,
      targetId: selectedId,
      position: selectedId ? 'after' : 'inside'
    }, '*')
    showNotice('Elemento adicionado')
  }

  return (
    <div>
      {ELEMENT_TEMPLATES.map(group => (
        <div key={group.category}>
          <div className="lib-section-title">{group.category}</div>
          <div className="lib-grid">
            {group.items.map(item => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  className="lib-item"
                  onClick={() => insert(item.html)}
                  title={`Adicionar ${item.label.toLowerCase()}`}
                >
                  <span className="lib-item-icon"><Icon size={20} /></span>
                  <span className="lib-item-label">{item.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

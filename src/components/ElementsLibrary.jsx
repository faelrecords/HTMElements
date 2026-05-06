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

  function insertAtVisibleCenter(html) {
    const iframe = iframeRef.current
    if (!iframe) return
    iframe.contentWindow.postMessage({
      type: 'he:cmd:insertAtViewportCenter',
      html
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
                  draggable
                  onDragStart={(e) => {
                    window.__heInsertHTML = item.html
                    localStorage.setItem('htmelements:drag-html', item.html)
                    iframeRef.current?.contentWindow?.postMessage({ type: 'he:externalDrag', html: item.html }, '*')
                    e.dataTransfer.effectAllowed = 'copy'
                    e.dataTransfer.setData('text/html', item.html)
                    e.dataTransfer.setData('text/plain', item.label)
                  }}
                  onDragEnd={(e) => {
                    const rect = iframeRef.current?.getBoundingClientRect()
                    const html = window.__heInsertHTML
                    if (rect && html) {
                      const x = e.clientX - rect.left
                      const y = e.clientY - rect.top
                      if (x >= 0 && y >= 0 && x <= rect.width && y <= rect.height) {
                        iframeRef.current.contentWindow.postMessage({ type: 'he:cmd:insertAtPoint', html, x, y }, '*')
                      }
                    }
                    window.__heInsertHTML = null
                    localStorage.removeItem('htmelements:drag-html')
                    iframeRef.current?.contentWindow?.postMessage({ type: 'he:externalDrag', html: '' }, '*')
                  }}
                  onClick={() => insertAtVisibleCenter(item.html)}
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

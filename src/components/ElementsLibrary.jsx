import { ELEMENT_TEMPLATES } from '../utils/elementTemplates'
import { useEditorStore } from '../store/editorStore'
import { useEffect, useRef, useState } from 'react'
import { Code2 } from 'lucide-react'

const SAVED_KEY = 'htmelements:saved-components:v1'

export default function ElementsLibrary({ iframeRef }) {
  const selectedId = useEditorStore(s => s.selectedId)
  const showNotice = useEditorStore(s => s.showNotice)
  const ghostRef = useRef(null)
  const [saved, setSaved] = useState([])

  useEffect(() => {
    const load = () => {
      try { setSaved(JSON.parse(localStorage.getItem(SAVED_KEY) || '[]')) } catch { setSaved([]) }
    }
    load()
    window.addEventListener('he:saved-components', load)
    return () => window.removeEventListener('he:saved-components', load)
  }, [])

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

  function startPointerDrag(e, item) {
    if (e.button !== 0) return
    e.preventDefault()
    const ghost = document.createElement('div')
    ghost.className = 'drag-ghost'
    ghost.textContent = item.label
    document.body.appendChild(ghost)
    ghostRef.current = ghost
    if (iframeRef.current) iframeRef.current.style.pointerEvents = 'none'

    const move = (ev) => {
      ghost.style.left = ev.clientX + 12 + 'px'
      ghost.style.top = ev.clientY + 12 + 'px'
      const rect = iframeRef.current?.getBoundingClientRect()
      const over = rect && ev.clientX >= rect.left && ev.clientY >= rect.top && ev.clientX <= rect.right && ev.clientY <= rect.bottom
      iframeRef.current?.contentWindow?.postMessage({
        type: 'he:externalPointer',
        active: !!over,
        x: rect ? ev.clientX - rect.left : 0,
        y: rect ? ev.clientY - rect.top : 0
      }, '*')
    }

    const up = (ev) => {
      const rect = iframeRef.current?.getBoundingClientRect()
      const over = rect && ev.clientX >= rect.left && ev.clientY >= rect.top && ev.clientX <= rect.right && ev.clientY <= rect.bottom
      if (over) {
        iframeRef.current.contentWindow.postMessage({
          type: 'he:cmd:insertAtPoint',
          html: item.html,
          x: ev.clientX - rect.left,
          y: ev.clientY - rect.top
        }, '*')
        showNotice('Elemento adicionado')
      }
      iframeRef.current?.contentWindow?.postMessage({ type: 'he:externalPointer', active: false }, '*')
      if (iframeRef.current) iframeRef.current.style.pointerEvents = ''
      ghost.remove()
      ghostRef.current = null
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }

    move(e)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  return (
    <div>
      {saved.length > 0 && (
        <div>
          <div className="lib-section-title">Salvos</div>
          <div className="lib-grid">
            {saved.map(item => (
              <button
                key={item.id}
                className="lib-item"
                draggable={false}
                onPointerDown={(e) => startPointerDrag(e, { ...item, label: item.name })}
                onClick={() => insert(item.html)}
                title={`Adicionar ${item.name}`}
              >
                <span className="lib-item-icon"><Code2 size={20} /></span>
                <span className="lib-item-label">{item.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
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
                  draggable={false}
                  onPointerDown={(e) => startPointerDrag(e, item)}
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

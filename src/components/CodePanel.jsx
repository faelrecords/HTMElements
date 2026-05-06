import { useEffect, useState } from 'react'
import { Check, X } from 'lucide-react'
import { useEditorStore } from '../store/editorStore'

export default function CodePanel() {
  const loadedHTML = useEditorStore(s => s.loadedHTML)
  const setHTML = useEditorStore(s => s.setHTML)
  const setCodeOpen = useEditorStore(s => s.setCodeOpen)
  const showNotice = useEditorStore(s => s.showNotice)
  const [draft, setDraft] = useState(loadedHTML || '')

  useEffect(() => {
    setDraft(loadedHTML || '')
  }, [loadedHTML])

  function apply() {
    setHTML(draft, { skipHistory: false })
    showNotice('Código aplicado')
  }

  return (
    <div className="code-panel">
      <div className="code-panel-head">
        <span>HTML</span>
        <div className="topbar-section">
          <button className="btn btn-icon btn-ghost" onClick={apply} title="Aplicar código">
            <Check size={16} />
          </button>
          <button className="btn btn-icon btn-ghost" onClick={() => setCodeOpen(false)} title="Fechar código">
            <X size={16} />
          </button>
        </div>
      </div>
      <textarea
        className="code-editor"
        spellCheck={false}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
      />
    </div>
  )
}

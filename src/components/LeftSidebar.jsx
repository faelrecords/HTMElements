import { useEditorStore } from '../store/editorStore'
import ElementTree from './ElementTree'
import ElementsLibrary from './ElementsLibrary'

export default function LeftSidebar({ iframeRef }) {
  const tab = useEditorStore(s => s.leftTab)
  const setTab = useEditorStore(s => s.setLeftTab)

  return (
    <aside className="sidebar sidebar-left">
      <div className="sidebar-tabs">
        <button
          className={'sidebar-tab ' + (tab === 'tree' ? 'active' : '')}
          onClick={() => setTab('tree')}
        >Estrutura</button>
        <button
          className={'sidebar-tab ' + (tab === 'library' ? 'active' : '')}
          onClick={() => setTab('library')}
        >Adicionar</button>
      </div>
      <div className="sidebar-body">
        {tab === 'tree' ? <ElementTree iframeRef={iframeRef} /> : <ElementsLibrary iframeRef={iframeRef} />}
      </div>
    </aside>
  )
}

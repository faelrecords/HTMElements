import PropertiesPanel from './PropertiesPanel'

export default function RightSidebar({ iframeRef }) {
  return (
    <aside className="sidebar sidebar-right">
      <div className="sidebar-tabs">
        <button className="sidebar-tab active">Propriedades</button>
      </div>
      <div className="sidebar-body" style={{ padding: 0 }}>
        <PropertiesPanel iframeRef={iframeRef} />
      </div>
    </aside>
  )
}

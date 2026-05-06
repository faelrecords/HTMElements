import { ChevronDown, ChevronRight, Box } from 'lucide-react'
import { useState } from 'react'
import { useEditorStore } from '../store/editorStore'

function TreeNode({ node, depth, onSelect, selectedId }) {
  const [open, setOpen] = useState(depth < 2)
  const hasChildren = node.children && node.children.length > 0
  const isSelected = selectedId === node.id

  return (
    <div>
      <div
        className={'tree-item ' + (isSelected ? 'selected' : '')}
        onClick={(e) => { e.stopPropagation(); onSelect(node.id) }}
      >
        {hasChildren ? (
          <span className="tree-toggle" onClick={(e) => { e.stopPropagation(); setOpen(o => !o) }}>
            {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </span>
        ) : (
          <span className="tree-toggle"><Box size={10} /></span>
        )}
        <span className="tree-item-label">{node.label}</span>
        <span className="tree-item-tag">{node.tag}</span>
      </div>
      {hasChildren && open && (
        <div className="tree-children">
          {node.children.map(child => (
            <TreeNode key={child.id} node={child} depth={depth + 1} onSelect={onSelect} selectedId={selectedId} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function ElementTree({ iframeRef }) {
  const tree = useEditorStore(s => s.treeData)
  const selectedId = useEditorStore(s => s.selectedId)

  function selectNode(id) {
    iframeRef.current?.contentWindow?.postMessage({ type: 'he:cmd:select', id }, '*')
  }

  if (!tree) {
    return <div className="sidebar-empty">Carregue um HTML para ver a árvore.</div>
  }

  return (
    <div onClick={() => selectNode(null)}>
      <TreeNode node={tree} depth={0} onSelect={selectNode} selectedId={selectedId} />
    </div>
  )
}

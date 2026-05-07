import {
  ChevronDown, ChevronRight, Box, Layout, Type, Image, MousePointerClick,
  List, Minus, Square, Layers, Search, Eye, Heading1
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useEditorStore } from '../store/editorStore'

const ICONS = {
  body: Layers,
  main: Layout,
  section: Layout,
  header: Layout,
  footer: Layout,
  div: Square,
  h1: Heading1,
  h2: Heading1,
  h3: Heading1,
  p: Type,
  span: Type,
  a: MousePointerClick,
  button: MousePointerClick,
  img: Image,
  ul: List,
  ol: List,
  li: List,
  hr: Minus,
}

const NAMES = {
  body: 'Página',
  main: 'Principal',
  section: 'Seção',
  header: 'Topo',
  footer: 'Rodapé',
  nav: 'Navegação',
  div: 'Container',
  h1: 'Título',
  h2: 'Título',
  h3: 'Título',
  p: 'Texto',
  span: 'Texto',
  a: 'Link/Botão',
  button: 'Botão',
  img: 'Imagem',
  ul: 'Lista',
  ol: 'Lista',
  li: 'Item',
  hr: 'Divisor',
}

function friendlyName(node) {
  const raw = node.label || ''
  const base = NAMES[node.tag] || node.tag
  if (raw.startsWith('#')) return raw
  if (raw.startsWith('.')) return raw.replace('.', '')
  if (raw && raw !== node.tag) return raw
  return base
}

function flattenTree(node, items = []) {
  if (!node) return items
  items.push(node)
  node.children?.forEach(child => flattenTree(child, items))
  return items
}

function nodeMatches(node, query) {
  if (!query) return true
  const q = query.toLowerCase()
  return [node.tag, node.label, friendlyName(node)].some(v => String(v || '').toLowerCase().includes(q))
}

function hasMatch(node, query) {
  if (nodeMatches(node, query)) return true
  return node.children?.some(child => hasMatch(child, query))
}

function TreeNode({ node, depth, onSelect, selectedId, query }) {
  const [open, setOpen] = useState(depth < 3)
  const hasChildren = node.children && node.children.length > 0
  const isSelected = selectedId === node.id
  const visible = hasMatch(node, query)
  const Icon = ICONS[node.tag] || Box

  if (!visible) return null

  return (
    <div>
      <div
        className={'layer-item ' + (isSelected ? 'selected' : '')}
        style={{ '--depth': depth }}
        onClick={(e) => { e.stopPropagation(); onSelect(node.id) }}
      >
        {hasChildren ? (
          <span className="layer-toggle" onClick={(e) => { e.stopPropagation(); setOpen(o => !o) }}>
            {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </span>
        ) : (
          <span className="layer-toggle" />
        )}
        <span className="layer-icon"><Icon size={14} /></span>
        <span className="layer-copy">
          <span className="layer-name">{friendlyName(node)}</span>
          <span className="layer-meta">{node.tag}{hasChildren ? ` · ${node.children.length}` : ''}</span>
        </span>
        <span className="layer-eye"><Eye size={13} /></span>
      </div>
      {hasChildren && open && (
        <div>
          {node.children.map(child => (
            <TreeNode key={child.id} node={child} depth={depth + 1} onSelect={onSelect} selectedId={selectedId} query={query} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function ElementTree({ iframeRef }) {
  const tree = useEditorStore(s => s.treeData)
  const selectedId = useEditorStore(s => s.selectedId)
  const [query, setQuery] = useState('')
  const stats = useMemo(() => {
    const all = flattenTree(tree, [])
    return {
      total: Math.max(0, all.length - 1),
      sections: all.filter(n => n.tag === 'section').length,
    }
  }, [tree])

  function selectNode(id) {
    iframeRef.current?.contentWindow?.postMessage({ type: 'he:cmd:select', id }, '*')
  }

  if (!tree) {
    return <div className="sidebar-empty">Carregue um HTML para ver a árvore.</div>
  }

  return (
    <div className="layers-panel" onClick={() => selectNode(null)}>
      <div className="layers-summary">
        <div>
          <span>{stats.total}</span>
          <small>elementos</small>
        </div>
        <div>
          <span>{stats.sections}</span>
          <small>seções</small>
        </div>
      </div>
      <label className="layers-search" onClick={(e) => e.stopPropagation()}>
        <Search size={14} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar camada"
        />
      </label>
      {selectedId && (
        <div className="layers-breadcrumb">
          {flattenTree(tree, []).find(n => n.id === selectedId)?.breadcrumb || ''}
        </div>
      )}
      <TreeNode node={tree} depth={0} onSelect={selectNode} selectedId={selectedId} query={query} />
    </div>
  )
}

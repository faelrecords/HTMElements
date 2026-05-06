import { useState, useEffect, useCallback } from 'react'
import {
  Trash2, Copy, ArrowUp, ArrowDown, MousePointer2,
  AlignLeft, AlignCenter, AlignRight, AlignJustify, Code2
} from 'lucide-react'
import { useEditorStore } from '../store/editorStore'

const TEXT_TAGS = ['h1','h2','h3','h4','h5','h6','p','span','a','button','li','strong','em','div','label']
const IMG_TAGS = ['img']
const VIDEO_TAGS = ['video', 'source']
const LINK_TAGS = ['a']
const BORDER_STYLES = ['none', 'solid', 'dashed', 'dotted', 'double']

function parsePx(v) {
  if (!v) return ''
  const m = String(v).match(/^([\d.]+)px$/)
  return m ? m[1] : v
}

function hexToRgba(hex, opacity) {
  const clean = String(hex || '#000000').replace('#', '')
  const num = parseInt(clean.length === 3 ? clean.split('').map(x => x + x).join('') : clean, 16)
  const r = (num >> 16) & 255
  const g = (num >> 8) & 255
  const b = num & 255
  return `rgba(${r},${g},${b},${opacity})`
}

export default function PropertiesPanel({ iframeRef }) {
  const selectedId = useEditorStore(s => s.selectedId)
  const [info, setInfo] = useState(null)
  const [contentMode, setContentMode] = useState('text')
  const [bgMode, setBgMode] = useState('color')
  const [gradStart, setGradStart] = useState('#6D71F0')
  const [gradEnd, setGradEnd] = useState('#2BBF88')
  const [gradAngle, setGradAngle] = useState('135')
  const [shadowKind, setShadowKind] = useState('box')
  const [shadowX, setShadowX] = useState('0')
  const [shadowY, setShadowY] = useState('12')
  const [shadowBlur, setShadowBlur] = useState('32')
  const [shadowSpread, setShadowSpread] = useState('0')
  const [shadowOpacity, setShadowOpacity] = useState('0.18')
  const [shadowColor, setShadowColor] = useState('#000000')
  const showNotice = useEditorStore(s => s.showNotice)

  // recebe info quando o iframe envia
  useEffect(() => {
    function onMsg(e) {
      const m = e.data || {}
      if (m.type === 'he:select') {
        setInfo(m.info ? { id: m.id, tag: m.tag, ...m.info } : null)
      }
      if (m.type === 'he:select' && !m.info) setInfo(null)
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [])

  // limpa info se desselecionou
  useEffect(() => {
    if (!selectedId) setInfo(null)
  }, [selectedId])

  const send = useCallback((type, payload) => {
    const iframe = iframeRef.current
    if (!iframe) return
    iframe.contentWindow.postMessage({ type, id: selectedId, ...payload }, '*')
  }, [iframeRef, selectedId])

  const setStyle = useCallback((styles) => {
    send('he:cmd:setStyle', { styles })
    setInfo(prev => prev ? { ...prev, styles: { ...prev.styles, ...styles } } : prev)
  }, [send])

  const setAttr = useCallback((name, value) => {
    send('he:cmd:setAttr', { name, value })
    setInfo(prev => prev ? { ...prev, [name + 'Attr']: value } : prev)
  }, [send])

  const applyGradient = useCallback(() => {
    setStyle({
      backgroundColor: '',
      backgroundImage: `linear-gradient(${gradAngle || 135}deg, ${gradStart}, ${gradEnd})`
    })
  }, [gradAngle, gradStart, gradEnd, setStyle])

  const applyShadow = useCallback((value) => {
    if (shadowKind === 'text') setStyle({ textShadow: value })
    else setStyle({ boxShadow: value })
  }, [shadowKind, setStyle])

  const applyCustomShadow = useCallback(() => {
    const color = hexToRgba(shadowColor, shadowOpacity)
    const value = shadowKind === 'text'
      ? `${shadowX}px ${shadowY}px ${shadowBlur}px ${color}`
      : `${shadowX}px ${shadowY}px ${shadowBlur}px ${shadowSpread}px ${color}`
    applyShadow(value)
  }, [applyShadow, shadowBlur, shadowColor, shadowKind, shadowOpacity, shadowSpread, shadowX, shadowY])

  useEffect(() => {
    if (!selectedId || !info) return
    applyCustomShadow()
  }, [shadowX, shadowY, shadowBlur, shadowSpread, shadowOpacity, shadowColor, shadowKind])

  if (!selectedId || !info) {
    return (
      <div className="props-empty">
        <div className="props-empty-icon"><MousePointer2 size={36} /></div>
        Selecione um elemento clicando no canvas.
      </div>
    )
  }

  const isText = TEXT_TAGS.includes(info.tag)
  const isImg = IMG_TAGS.includes(info.tag)
  const isVideo = VIDEO_TAGS.includes(info.tag)
  const isLink = LINK_TAGS.includes(info.tag)

  return (
    <div>
      {/* ações rápidas */}
      <div className="action-row">
        <button className="action-btn" onClick={() => send('he:cmd:move', { dir: 'up' })}>
          <ArrowUp size={14} /> Subir
        </button>
        <button className="action-btn" onClick={() => send('he:cmd:move', { dir: 'down' })}>
          <ArrowDown size={14} /> Descer
        </button>
        <button className="action-btn" onClick={() => send('he:cmd:duplicate', {})}>
          <Copy size={14} /> Duplicar
        </button>
        <button className="action-btn danger" onClick={() => {
          if (confirm('Remover este elemento?')) {
            send('he:cmd:delete', {})
            showNotice('Removido')
          }
        }}>
          <Trash2 size={14} /> Deletar
        </button>
      </div>

      {/* conteúdo */}
      {isText && (
        <div className="props-section">
          <div className="props-section-title">Conteúdo</div>
          {info.hasChildren && (
            <div className="btn-group props-mode-group">
              <button
                className={contentMode === 'text' ? 'active' : ''}
                onClick={() => setContentMode('text')}
              >Texto</button>
              <button
                className={contentMode === 'html' ? 'active' : ''}
                onClick={() => setContentMode('html')}
              ><Code2 size={13} /> HTML</button>
            </div>
          )}
          <textarea
            className="props-textarea"
            value={contentMode === 'html' ? (info.html || '') : (info.text || '')}
            onChange={(e) => {
              const value = e.target.value
              if (contentMode === 'html') {
                setInfo(prev => ({ ...prev, html: value }))
                send('he:cmd:setHtml', { html: value })
              } else {
                setInfo(prev => ({ ...prev, text: value, html: value }))
                send('he:cmd:setText', { text: value })
              }
            }}
          />
          {info.hasChildren && contentMode === 'text' && (
            <div className="props-hint">Editar texto remove filhos do elemento.</div>
          )}
        </div>
      )}

      {isLink && (
        <div className="props-section">
          <div className="props-section-title">Link</div>
          <div className="props-row">
            <span className="props-label">URL</span>
            <input
              type="text"
              value={info.hrefAttr || ''}
              onChange={(e) => {
                setInfo(prev => ({ ...prev, hrefAttr: e.target.value }))
                send('he:cmd:setAttr', { name: 'href', value: e.target.value })
              }}
              placeholder="https://"
            />
          </div>
        </div>
      )}

      {(isImg || isVideo) && (
        <div className="props-section">
          <div className="props-section-title">{isImg ? 'Imagem' : 'Vídeo'}</div>
          <div className="props-row">
            <span className="props-label">URL</span>
            <input
              type="text"
              value={info.srcAttr || ''}
              onChange={(e) => {
                setInfo(prev => ({ ...prev, srcAttr: e.target.value }))
                send('he:cmd:setAttr', { name: 'src', value: e.target.value })
              }}
              placeholder="https://..."
            />
          </div>
          {isImg && (
            <>
            <div className="props-row">
              <span className="props-label">Alt</span>
              <input
                type="text"
                value={info.altAttr || ''}
                onChange={(e) => {
                  setInfo(prev => ({ ...prev, altAttr: e.target.value }))
                  send('he:cmd:setAttr', { name: 'alt', value: e.target.value })
                }}
              />
            </div>
            <div className="props-row">
              <span className="props-label">Arquivo</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  setInfo(prev => ({ ...prev, srcAttr: file.name }))
                  send('he:cmd:setAttr', { name: 'src', value: file.name })
                  showNotice('Imagem referenciada pelo nome')
                }}
              />
            </div>
            </>
          )}
          {isVideo && info.tag === 'video' && (
            <div className="props-hint">Selecione source dentro do vídeo para trocar URL.</div>
          )}
        </div>
      )}

      {/* tipografia */}
      <div className="props-section">
        <div className="props-section-title">Tipografia</div>
        <div className="props-row">
          <span className="props-label">Cor</span>
          <ColorField
            value={info.styles.color}
            onChange={(v) => setStyle({ color: v })}
          />
        </div>
        <div className="props-row">
          <span className="props-label">Tamanho</span>
          <input
            type="number"
            min="8"
            max="200"
            value={parsePx(info.styles.fontSize)}
            onChange={(e) => setStyle({ fontSize: e.target.value + 'px' })}
          />
        </div>
        <div className="props-row">
          <span className="props-label">Peso</span>
          <select
            value={info.styles.fontWeight}
            onChange={(e) => setStyle({ fontWeight: e.target.value })}
          >
            <option value="300">Light (300)</option>
            <option value="400">Regular (400)</option>
            <option value="500">Medium (500)</option>
            <option value="600">Semibold (600)</option>
            <option value="700">Bold (700)</option>
            <option value="800">Extrabold (800)</option>
            <option value="900">Black (900)</option>
          </select>
        </div>
        <div className="props-row">
          <span className="props-label">Linha</span>
          <input
            type="text"
            value={info.styles.lineHeight || ''}
            onChange={(e) => setStyle({ lineHeight: e.target.value })}
            placeholder="1.5 ou 24px"
          />
        </div>
        <div className="props-row">
          <span className="props-label">Alinhar</span>
          <div className="btn-group" style={{ flex: 1 }}>
            {[
              { v: 'left', icon: AlignLeft },
              { v: 'center', icon: AlignCenter },
              { v: 'right', icon: AlignRight },
              { v: 'justify', icon: AlignJustify }
            ].map(({ v, icon: Icon }) => (
              <button
                key={v}
                className={info.styles.textAlign === v ? 'active' : ''}
                onClick={() => setStyle({ textAlign: v })}
              ><Icon size={13} /></button>
            ))}
          </div>
        </div>
      </div>

      {/* fundo */}
      <div className="props-section">
        <div className="props-section-title">Fundo</div>
        <div className="btn-group props-mode-group">
          <button className={bgMode === 'color' ? 'active' : ''} onClick={() => setBgMode('color')}>Cor</button>
          <button className={bgMode === 'gradient' ? 'active' : ''} onClick={() => setBgMode('gradient')}>Gradiente</button>
        </div>
        <div className="props-row">
          <span className="props-label">{bgMode === 'color' ? 'Cor' : 'CSS'}</span>
          {bgMode === 'color' ? (
            <ColorField
              value={info.styles.backgroundColor}
              onChange={(v) => setStyle({ backgroundColor: v, backgroundImage: '' })}
              allowTransparent
            />
          ) : (
            <input
              type="text"
              value={info.styles.backgroundImage || ''}
              onChange={(e) => setStyle({ backgroundImage: e.target.value, backgroundColor: '' })}
              placeholder="linear-gradient(135deg, #6d71f0, #2bbf88)"
            />
          )}
        </div>
        {bgMode === 'gradient' && (
          <>
            <div className="props-grid-3">
              <ColorField value={gradStart} onChange={setGradStart} />
              <ColorField value={gradEnd} onChange={setGradEnd} />
              <input type="number" value={gradAngle} onChange={(e) => setGradAngle(e.target.value)} title="Ângulo" />
            </div>
            <button className="action-btn full-width" onClick={applyGradient}>Aplicar gradiente</button>
            <div className="gradient-presets">
              {[
                'linear-gradient(135deg, #6d71f0, #2bbf88)',
                'linear-gradient(135deg, #0f172a, #334155)',
                'radial-gradient(circle at top, #ffffff, #e9fff5)',
                'linear-gradient(180deg, #ffffff, #f1f5f9)'
              ].map(v => (
                <button key={v} style={{ backgroundImage: v }} onClick={() => setStyle({ backgroundImage: v, backgroundColor: '' })} title={v} />
              ))}
            </div>
          </>
        )}
        <div className="props-row">
          <span className="props-label">Display</span>
          <select
            value={info.styles.display || ''}
            onChange={(e) => setStyle({ display: e.target.value })}
          >
            <option value="">auto</option>
            <option value="block">block</option>
            <option value="inline-block">inline-block</option>
            <option value="flex">flex</option>
            <option value="grid">grid</option>
            <option value="none">none</option>
          </select>
        </div>
        {(info.styles.display === 'flex' || info.styles.display === 'inline-flex') && (
          <>
            <div className="props-row">
              <span className="props-label">Justify</span>
              <select value={info.styles.justifyContent || ''} onChange={(e) => setStyle({ justifyContent: e.target.value })}>
                <option value="">auto</option>
                <option value="flex-start">start</option>
                <option value="center">center</option>
                <option value="flex-end">end</option>
                <option value="space-between">between</option>
                <option value="space-around">around</option>
              </select>
            </div>
            <div className="props-row">
              <span className="props-label">Align</span>
              <select value={info.styles.alignItems || ''} onChange={(e) => setStyle({ alignItems: e.target.value })}>
                <option value="">auto</option>
                <option value="stretch">stretch</option>
                <option value="flex-start">start</option>
                <option value="center">center</option>
                <option value="flex-end">end</option>
              </select>
            </div>
          </>
        )}
        {info.styles.display === 'grid' && (
          <div className="props-row">
            <span className="props-label">Colunas</span>
            <input
              type="text"
              value={info.styles.gridTemplateColumns || ''}
              onChange={(e) => setStyle({ gridTemplateColumns: e.target.value })}
              placeholder="repeat(3, 1fr)"
            />
          </div>
        )}
        <div className="props-row">
          <span className="props-label">Gap</span>
          <input
            type="text"
            value={info.styles.gap || ''}
            onChange={(e) => setStyle({ gap: e.target.value })}
            placeholder="16px"
          />
        </div>
        <div className="props-row">
          <span className="props-label">Borda</span>
          <input
            type="number"
            min="0"
            value={parsePx(info.styles.borderRadius)}
            onChange={(e) => setStyle({ borderRadius: e.target.value + 'px' })}
            placeholder="raio"
          />
        </div>
        <div className="props-row">
          <span className="props-label">Cor borda</span>
          <ColorField value={info.styles.borderColor} onChange={(v) => setStyle({ borderColor: v })} />
        </div>
        <div className="props-row">
          <span className="props-label">Tipo borda</span>
          <select value={info.styles.borderStyle || ''} onChange={(e) => setStyle({ borderStyle: e.target.value })}>
            {BORDER_STYLES.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div className="props-row">
          <span className="props-label">Larg. borda</span>
          <input
            type="number"
            min="0"
            value={parsePx(info.styles.borderWidth)}
            onChange={(e) => setStyle({ borderWidth: e.target.value + 'px' })}
          />
        </div>
        <div className="props-row">
          <span className="props-label">Sombra</span>
          <input
            type="text"
            value={shadowKind === 'text' ? (info.styles.textShadow || '') : (info.styles.boxShadow || '')}
            onChange={(e) => applyShadow(e.target.value)}
            placeholder="0 10px 30px rgba(0,0,0,.12)"
          />
        </div>
        <div className="btn-group props-mode-group">
          <button className={shadowKind === 'box' ? 'active' : ''} onClick={() => setShadowKind('box')}>Caixa</button>
          <button className={shadowKind === 'text' ? 'active' : ''} onClick={() => setShadowKind('text')}>Texto</button>
        </div>
        <div className="shadow-builder">
          <label>Cor <ColorField value={shadowColor} onChange={setShadowColor} /></label>
          <label>X <input type="range" min="-100" max="100" value={shadowX} onChange={(e) => setShadowX(e.target.value)} /></label>
          <label>Y <input type="range" min="-100" max="100" value={shadowY} onChange={(e) => setShadowY(e.target.value)} /></label>
          <label>Suavidade <input type="range" min="0" max="100" value={shadowBlur} onChange={(e) => setShadowBlur(e.target.value)} /></label>
          {shadowKind === 'box' && (
            <label>Tamanho <input type="range" min="-40" max="80" value={shadowSpread} onChange={(e) => setShadowSpread(e.target.value)} /></label>
          )}
          <label>Opacidade <input type="range" min="0" max="1" step="0.01" value={shadowOpacity} onChange={(e) => setShadowOpacity(e.target.value)} /></label>
          <button className="action-btn full-width" onClick={() => applyShadow('')}>Remover sombra</button>
        </div>
      </div>

      <div className="props-section">
        <div className="props-section-title">Layout</div>
        <div className="props-row">
          <span className="props-label">Largura</span>
          <input type="text" value={info.styles.width || ''} onChange={(e) => setStyle({ width: e.target.value })} placeholder="auto / 100%" />
        </div>
        <div className="props-row">
          <span className="props-label">Max</span>
          <input type="text" value={info.styles.maxWidth || ''} onChange={(e) => setStyle({ maxWidth: e.target.value })} placeholder="1200px" />
        </div>
        <div className="props-row">
          <span className="props-label">Altura</span>
          <input type="text" value={info.styles.height || ''} onChange={(e) => setStyle({ height: e.target.value })} placeholder="auto / 400px" />
        </div>
        <div className="props-row">
          <span className="props-label">Opacidade</span>
          <input
            type="number"
            min="0"
            max="1"
            step="0.05"
            value={info.styles.opacity || ''}
            onChange={(e) => setStyle({ opacity: e.target.value })}
          />
        </div>
      </div>

      {/* espaçamento */}
      <div className="props-section">
        <div className="props-section-title">Espaçamento</div>
        <div className="props-row">
          <span className="props-label">Padding</span>
          <div className="props-grid-4">
            <SpacingField value={info.styles.paddingTop} onChange={v => setStyle({ paddingTop: v })} placeholder="T" />
            <SpacingField value={info.styles.paddingRight} onChange={v => setStyle({ paddingRight: v })} placeholder="R" />
            <SpacingField value={info.styles.paddingBottom} onChange={v => setStyle({ paddingBottom: v })} placeholder="B" />
            <SpacingField value={info.styles.paddingLeft} onChange={v => setStyle({ paddingLeft: v })} placeholder="L" />
          </div>
        </div>
        <div className="props-row">
          <span className="props-label">Margin</span>
          <div className="props-grid-4">
            <SpacingField value={info.styles.marginTop} onChange={v => setStyle({ marginTop: v })} placeholder="T" />
            <SpacingField value={info.styles.marginRight} onChange={v => setStyle({ marginRight: v })} placeholder="R" />
            <SpacingField value={info.styles.marginBottom} onChange={v => setStyle({ marginBottom: v })} placeholder="B" />
            <SpacingField value={info.styles.marginLeft} onChange={v => setStyle({ marginLeft: v })} placeholder="L" />
          </div>
        </div>
      </div>

      {/* atributos */}
      <div className="props-section">
        <div className="props-section-title">Atributos</div>
        <div className="props-row">
          <span className="props-label">Classe</span>
          <input
            type="text"
            value={info.classList || ''}
            onChange={(e) => {
              setInfo(prev => ({ ...prev, classList: e.target.value }))
              send('he:cmd:setClass', { value: e.target.value })
            }}
            placeholder="minha-classe"
          />
        </div>
        <div className="props-row">
          <span className="props-label">ID</span>
          <input
            type="text"
            value={info.idAttr || ''}
            onChange={(e) => {
              setInfo(prev => ({ ...prev, idAttr: e.target.value }))
              send('he:cmd:setAttr', { name: 'id', value: e.target.value })
            }}
            placeholder="meu-id"
          />
        </div>
        <div className="props-row">
          <span className="props-label">Tag</span>
          <input type="text" value={info.tag} disabled style={{ opacity: 0.6 }} />
        </div>
        <div className="props-row">
          <span className="props-label">Title</span>
          <input
            type="text"
            value={info.titleAttr || ''}
            onChange={(e) => setAttr('title', e.target.value)}
            placeholder="tooltip"
          />
        </div>
        <div className="props-row">
          <span className="props-label">Role</span>
          <input
            type="text"
            value={info.roleAttr || ''}
            onChange={(e) => setAttr('role', e.target.value)}
            placeholder="button"
          />
        </div>
        <div className="props-row">
          <span className="props-label">Aria</span>
          <input
            type="text"
            value={info.ariaLabelAttr || ''}
            onChange={(e) => setAttr('aria-label', e.target.value)}
            placeholder="label acessível"
          />
        </div>
        <div className="props-row">
          <span className="props-label">Style</span>
          <textarea
            className="props-textarea mini"
            value={info.inlineStyle || ''}
            onChange={(e) => {
              setInfo(prev => ({ ...prev, inlineStyle: e.target.value }))
              send('he:cmd:setAttr', { name: 'style', value: e.target.value })
            }}
          />
        </div>
      </div>
    </div>
  )
}

function ColorField({ value, onChange, allowTransparent }) {
  const v = value === 'transparent' ? '' : value || ''
  const safe = /^#[0-9A-F]{6}$/i.test(v) ? v : '#000000'
  return (
    <div className="color-input">
      <input
        type="color"
        value={safe}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
      />
      <input
        type="text"
        value={value === 'transparent' ? 'transparent' : v}
        onChange={(e) => onChange(e.target.value)}
        placeholder={allowTransparent ? 'transparent' : '#000000'}
      />
    </div>
  )
}

function SpacingField({ value, onChange, placeholder }) {
  return (
    <input
      type="number"
      min="0"
      value={parsePx(value)}
      onChange={(e) => onChange(e.target.value === '' ? '' : e.target.value + 'px')}
      placeholder={placeholder}
      style={{ textAlign: 'center', padding: '6px 4px', fontSize: '12px' }}
    />
  )
}

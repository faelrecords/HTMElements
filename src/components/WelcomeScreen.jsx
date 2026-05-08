import { useState, useRef } from 'react'
import { UploadCloud, FileCode } from 'lucide-react'

export const BLANK_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Página em branco</title>
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin:0;background:#fff;color:#0f172a;min-height:100vh;">
</body>
</html>`

export default function WelcomeScreen({ onLoad }) {
  const [dragging, setDragging] = useState(false)
  const [rawHtml, setRawHtml] = useState('')
  const inputRef = useRef(null)

  function readFile(file) {
    if (!file) return
    if (!file.name.endsWith('.html') && !file.name.endsWith('.htm') && file.type !== 'text/html') {
      alert('Envie um arquivo .html')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => onLoad(e.target.result)
    reader.readAsText(file)
  }

  return (
    <div className="welcome">
      <div className="welcome-card">
        <div className="welcome-logo">HE</div>
        <h1>HTMElements</h1>
        <p>Editor visual no estilo Elementor para arquivos HTML. Faça upload do seu arquivo e edite com cliques.</p>

        <div
          className={'welcome-drop ' + (dragging ? 'dragging' : '')}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            readFile(e.dataTransfer.files?.[0])
          }}
        >
          <div className="welcome-drop-icon">
            <UploadCloud size={40} />
          </div>
          <div className="welcome-drop-text">Arraste um .html ou clique para selecionar</div>
          <div className="welcome-drop-hint">Tamanho recomendado: até 5 MB</div>
          <input
            ref={inputRef}
            type="file"
            accept=".html,.htm,text/html"
            style={{ display: 'none' }}
            onChange={(e) => readFile(e.target.files?.[0])}
          />
        </div>

        <div className="welcome-code">
          <textarea
            value={rawHtml}
            onChange={(e) => setRawHtml(e.target.value)}
            placeholder="Cole seu código HTML aqui"
          />
          <button
            className="btn"
            disabled={!rawHtml.trim()}
            onClick={() => onLoad(rawHtml)}
          >
            <FileCode size={14} /> Importar código HTML
          </button>
        </div>

        <div className="welcome-actions">
          <button className="btn" onClick={() => onLoad(BLANK_HTML)}>
            <FileCode size={14} /> Documento em branco
          </button>
        </div>
      </div>
    </div>
  )
}

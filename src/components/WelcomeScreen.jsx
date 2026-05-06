import { useState, useRef } from 'react'
import { UploadCloud, FileCode } from 'lucide-react'

const SAMPLE = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Página em branco</title>
</head>
<body style="font-family:-apple-system,sans-serif;margin:0;background:#fff;color:#0a1f2b;">
<section style="padding:80px 24px;text-align:center;">
<h1 style="font-size:48px;font-weight:700;margin:0 0 16px;letter-spacing:-0.02em;">Comece por aqui</h1>
<p style="font-size:18px;color:#5a6b73;max-width:560px;margin:0 auto 32px;line-height:1.55;">Clique em qualquer elemento para editar. Use o painel lateral para adicionar novos blocos.</p>
<a href="#" style="display:inline-block;padding:14px 28px;background:#6d71f0;color:#fff;border-radius:100px;text-decoration:none;font-weight:600;">Botão de exemplo</a>
</section>
</body>
</html>`

export default function WelcomeScreen({ onLoad }) {
  const [dragging, setDragging] = useState(false)
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

        <div className="welcome-actions">
          <button className="btn" onClick={() => onLoad(SAMPLE)}>
            <FileCode size={14} /> Começar em branco
          </button>
        </div>
      </div>
    </div>
  )
}

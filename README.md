# HTMElements

Editor visual no estilo Elementor para arquivos HTML. Sem banco de dados, 100% client-side.

## Como funciona

1. Você sobe um arquivo `.html`
2. O arquivo é renderizado em um `iframe` isolado
3. Um script bridge é injetado no iframe para capturar cliques, hover e edições
4. As mudanças acontecem ao vivo no DOM do iframe
5. Você exporta o HTML final pronto para usar

Tudo roda no navegador. Nenhum dado sai da sua máquina.

## Stack

- React 18 + Vite
- Zustand (state)
- Lucide Icons
- @dnd-kit (preparado para drag-and-drop futuro)

## Rodar local

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deploy (GitHub Pages)

1. Push para `main`
2. Settings > Pages > Source: GitHub Actions
3. O workflow `.github/workflows/deploy.yml` faz tudo

Se for usar domínio próprio, edite `VITE_BASE_PATH` no workflow para `/`.

## Atalhos

- `Ctrl+Z` — desfazer
- `Ctrl+Y` ou `Ctrl+Shift+Z` — refazer
- `Delete` / `Backspace` — remover selecionado

## Recursos

- Upload de HTML por drag-and-drop
- Seleção visual no canvas
- Árvore de elementos navegável
- Biblioteca de blocos prontos (título, parágrafo, botão, imagem, colunas, cards etc)
- Edição de tipografia, cores, espaçamento, bordas
- Preview responsivo (desktop/tablet/mobile)
- Mover, duplicar, deletar elementos
- Histórico undo/redo
- Export do HTML limpo

## Observações

- Sem banco. Sem login. Sem nada. Recarregou a página, perdeu o trabalho. Exporte sempre.
- O bridge injetado adiciona `data-he-id` em todos os elementos enquanto edita. Esses atributos são removidos no export final.

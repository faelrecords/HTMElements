import { create } from 'zustand'

const MAX_HISTORY = 50
const AUTOSAVE_KEY = 'htmelements:autosave:v2'

function loadAutosave() {
  try {
    return localStorage.getItem(AUTOSAVE_KEY)
  } catch {
    return null
  }
}

function saveAutosave(html) {
  try {
    if (html) localStorage.setItem(AUTOSAVE_KEY, html)
    else localStorage.removeItem(AUTOSAVE_KEY)
  } catch {
    // localStorage pode estar indisponivel.
  }
}

export const useEditorStore = create((set, get) => ({
  // estado principal
  loadedHTML: loadAutosave(),  // HTML carregado (string completa)
  reloadKey: 0,
  selectedId: null,            // data-he-id do elemento selecionado
  hoveredId: null,
  device: 'desktop',           // desktop | tablet | mobile
  leftTab: 'tree',             // tree | library
  codeOpen: false,
  notice: null,
  history: [],                 // snapshots de loadedHTML
  historyIndex: -1,
  treeData: null,              // árvore de elementos {id, tag, label, children}

  setHTML(html, options = {}) {
    const state = get()
    if (html === state.loadedHTML && !options.forceReload) return

    if (!options.skipHistory && state.loadedHTML !== null && state.loadedHTML !== html) {
      const base = state.historyIndex >= 0
        ? state.history.slice(0, state.historyIndex + 1)
        : []
      const nextHistory = [...base, html]
      const overflow = Math.max(0, nextHistory.length - MAX_HISTORY)
      const trimmed = overflow ? nextHistory.slice(overflow) : nextHistory
      const nextIndex = trimmed.length - 1
      saveAutosave(html)
      set({
        loadedHTML: html,
        history: trimmed,
        historyIndex: nextIndex,
        reloadKey: options.skipReload ? state.reloadKey : state.reloadKey + 1,
      })
    } else {
      saveAutosave(html)
      set({
        loadedHTML: html,
        history: options.resetHistory ? [html] : state.history,
        historyIndex: options.resetHistory ? 0 : state.historyIndex,
        reloadKey: options.skipReload ? state.reloadKey : state.reloadKey + 1,
      })
    }
  },

  setTreeData: (treeData) => set({ treeData }),
  setSelected: (id) => set({ selectedId: id }),
  setHovered: (id) => set({ hoveredId: id }),
  setDevice: (device) => set({ device }),
  setLeftTab: (leftTab) => set({ leftTab }),
  setCodeOpen: (codeOpen) => set({ codeOpen }),

  showNotice(text, ms = 2400) {
    set({ notice: text })
    setTimeout(() => {
      if (get().notice === text) set({ notice: null })
    }, ms)
  },

  undo() {
    const { history, historyIndex, reloadKey } = get()
    if (historyIndex <= 0) return null
    const previous = history[historyIndex - 1]
    saveAutosave(previous)
    set({
      loadedHTML: previous,
      historyIndex: historyIndex - 1,
      reloadKey: reloadKey + 1,
      selectedId: null,
      hoveredId: null,
    })
    return previous
  },

  redo() {
    const { history, historyIndex, reloadKey } = get()
    const next = history[historyIndex + 1]
    if (!next) return null
    saveAutosave(next)
    set({
      loadedHTML: next,
      historyIndex: historyIndex + 1,
      reloadKey: reloadKey + 1,
      selectedId: null,
      hoveredId: null,
    })
    return next
  },

  reset() {
    saveAutosave(null)
    set({
      loadedHTML: null,
      reloadKey: 0,
      selectedId: null,
      hoveredId: null,
      treeData: null,
      history: [],
      historyIndex: -1,
    })
  },
}))

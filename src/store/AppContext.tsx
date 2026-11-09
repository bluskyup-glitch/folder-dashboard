import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react'
import type { FolderPanel, FavoriteFolder, ClipboardItem, FileEntry } from '../types'
import { generateId } from '../utils/fileUtils'

// ─── State ───────────────────────────────────────────────────────────────────

interface AppState {
  panels: FolderPanel[]
  favorites: FavoriteFolder[]
  clipboard: ClipboardItem | null
  activePanelId: string | null
  homeDir: string
}

type Action =
  | { type: 'SET_HOME_DIR'; homeDir: string }
  | { type: 'ADD_PANEL'; path?: string; rootPath?: string | null }
  | { type: 'REMOVE_PANEL'; panelId: string }
  | { type: 'SET_ACTIVE_PANEL'; panelId: string }
  | { type: 'NAVIGATE'; panelId: string; path: string }
  | { type: 'NAVIGATE_BACK'; panelId: string }
  | { type: 'NAVIGATE_FORWARD'; panelId: string }
  | { type: 'SET_PANEL_ENTRIES'; panelId: string; entries: FileEntry[] }
  | { type: 'SET_PANEL_LOADING'; panelId: string; loading: boolean }
  | { type: 'SET_PANEL_ERROR'; panelId: string; error: string | null }
  | { type: 'SET_SELECTION'; panelId: string; paths: Set<string> }
  | { type: 'TOGGLE_SELECTION'; panelId: string; path: string; multi: boolean }
  | { type: 'CLEAR_SELECTION'; panelId: string }
  | { type: 'SET_FAVORITES'; favorites: FavoriteFolder[] }
  | { type: 'ADD_FAVORITE'; favorite: FavoriteFolder }
  | { type: 'REMOVE_FAVORITE'; path: string }
  | { type: 'REORDER_FAVORITES'; favorites: FavoriteFolder[] }
  | { type: 'SET_CLIPBOARD'; clipboard: ClipboardItem | null }
  | { type: 'SET_SCROLL'; panelId: string; scrollTop: number }
  | { type: 'REFRESH_PANEL'; panelId: string }
  | { type: 'SET_PANEL_ROOT'; panelId: string; rootPath: string }

function makePanel(currentPath: string, rootPath: string | null = null): FolderPanel {
  return {
    id: generateId(),
    currentPath,
    rootPath,
    history: [currentPath],
    historyIndex: 0,
    entries: [],
    loading: false,
    error: null,
    selectedPaths: new Set(),
    scrollTop: 0,
  }
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_HOME_DIR':
      return { ...state, homeDir: action.homeDir }

    case 'ADD_PANEL': {
      const path = action.path || state.homeDir || '/'
      const panel = makePanel(path, action.rootPath ?? null)
      const panels = [...state.panels, panel]
      return { ...state, panels, activePanelId: panel.id }
    }

    case 'REMOVE_PANEL': {
      if (state.panels.length <= 1) return state
      const panels = state.panels.filter(p => p.id !== action.panelId)
      const activePanelId =
        state.activePanelId === action.panelId ? (panels[0]?.id ?? null) : state.activePanelId
      return { ...state, panels, activePanelId }
    }

    case 'SET_ACTIVE_PANEL':
      return { ...state, activePanelId: action.panelId }

    case 'NAVIGATE': {
      const panels = state.panels.map(p => {
        if (p.id !== action.panelId) return p
        const history = [...p.history.slice(0, p.historyIndex + 1), action.path]
        return {
          ...p,
          currentPath: action.path,
          history,
          historyIndex: history.length - 1,
          entries: [],
          loading: true,
          error: null,
          selectedPaths: new Set<string>(),
          scrollTop: 0,
        }
      })
      return { ...state, panels }
    }

    case 'NAVIGATE_BACK': {
      const panels = state.panels.map(p => {
        if (p.id !== action.panelId || p.historyIndex === 0) return p
        const historyIndex = p.historyIndex - 1
        const currentPath = p.history[historyIndex]
        return { ...p, currentPath, historyIndex, entries: [], loading: true, error: null, selectedPaths: new Set<string>() }
      })
      return { ...state, panels }
    }

    case 'NAVIGATE_FORWARD': {
      const panels = state.panels.map(p => {
        if (p.id !== action.panelId || p.historyIndex >= p.history.length - 1) return p
        const historyIndex = p.historyIndex + 1
        const currentPath = p.history[historyIndex]
        return { ...p, currentPath, historyIndex, entries: [], loading: true, error: null, selectedPaths: new Set<string>() }
      })
      return { ...state, panels }
    }

    case 'SET_PANEL_ENTRIES': {
      const panels = state.panels.map(p =>
        p.id === action.panelId ? { ...p, entries: action.entries, loading: false, error: null } : p
      )
      return { ...state, panels }
    }

    case 'SET_PANEL_LOADING': {
      const panels = state.panels.map(p =>
        p.id === action.panelId ? { ...p, loading: action.loading } : p
      )
      return { ...state, panels }
    }

    case 'SET_PANEL_ERROR': {
      const panels = state.panels.map(p =>
        p.id === action.panelId ? { ...p, error: action.error, loading: false } : p
      )
      return { ...state, panels }
    }

    case 'SET_SELECTION': {
      const panels = state.panels.map(p =>
        p.id === action.panelId ? { ...p, selectedPaths: action.paths } : p
      )
      return { ...state, panels }
    }

    case 'TOGGLE_SELECTION': {
      const panels = state.panels.map(p => {
        if (p.id !== action.panelId) return p
        const selectedPaths = new Set(p.selectedPaths)
        if (action.multi) {
          if (selectedPaths.has(action.path)) {
            selectedPaths.delete(action.path)
          } else {
            selectedPaths.add(action.path)
          }
        } else {
          if (selectedPaths.has(action.path) && selectedPaths.size === 1) {
            selectedPaths.clear()
          } else {
            selectedPaths.clear()
            selectedPaths.add(action.path)
          }
        }
        return { ...p, selectedPaths }
      })
      return { ...state, panels }
    }

    case 'CLEAR_SELECTION': {
      const panels = state.panels.map(p =>
        p.id === action.panelId ? { ...p, selectedPaths: new Set<string>() } : p
      )
      return { ...state, panels }
    }

    case 'SET_FAVORITES':
      return { ...state, favorites: action.favorites }

    case 'ADD_FAVORITE': {
      const exists = state.favorites.some(f => f.path === action.favorite.path)
      if (exists) return state
      return { ...state, favorites: [...state.favorites, action.favorite] }
    }

    case 'REMOVE_FAVORITE':
      return { ...state, favorites: state.favorites.filter(f => f.path !== action.path) }

    case 'REORDER_FAVORITES':
      return { ...state, favorites: action.favorites }

    case 'SET_CLIPBOARD':
      return { ...state, clipboard: action.clipboard }

    case 'SET_SCROLL': {
      const panels = state.panels.map(p =>
        p.id === action.panelId ? { ...p, scrollTop: action.scrollTop } : p
      )
      return { ...state, panels }
    }

    case 'REFRESH_PANEL': {
      const panels = state.panels.map(p =>
        p.id === action.panelId ? { ...p, entries: [], loading: true, error: null } : p
      )
      return { ...state, panels }
    }

    case 'SET_PANEL_ROOT': {
      const panels = state.panels.map(p =>
        p.id === action.panelId ? { ...p, rootPath: action.rootPath } : p
      )
      return { ...state, panels }
    }

    default:
      return state
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface AppContextType {
  state: AppState
  dispatch: React.Dispatch<Action>
  loadPanel: (panelId: string, path: string) => void
  refreshPanel: (panelId: string) => void
  saveFavorites: (favorites: FavoriteFolder[]) => void
}

const AppContext = createContext<AppContextType | null>(null)

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    panels: [],
    favorites: [],
    clipboard: null,
    activePanelId: null,
    homeDir: '/',
  })

  const loadingRef = useRef<Set<string>>(new Set())

  const loadPanel = useCallback(async (panelId: string, path: string) => {
    const key = `${panelId}:${path}`
    if (loadingRef.current.has(key)) return
    loadingRef.current.add(key)
    try {
      const entries = await window.electronAPI.readDir(path)
      dispatch({ type: 'SET_PANEL_ENTRIES', panelId, entries })
    } catch (err: any) {
      dispatch({ type: 'SET_PANEL_ERROR', panelId, error: err.message })
    } finally {
      loadingRef.current.delete(key)
    }
  }, [])

  const refreshPanel = useCallback((panelId: string) => {
    dispatch({ type: 'REFRESH_PANEL', panelId })
  }, [])

  const saveFavorites = useCallback(async (favorites: FavoriteFolder[]) => {
    dispatch({ type: 'SET_FAVORITES', favorites })
    await window.electronAPI.configSet('favorites', favorites)
  }, [])

  // Bootstrap: load homeDir and init panels
  useEffect(() => {
    async function init() {
      const homeDir = await window.electronAPI.homeDir()
      dispatch({ type: 'SET_HOME_DIR', homeDir })

      // Load saved favorites
      const savedFavs = await window.electronAPI.configGet('favorites') as FavoriteFolder[] | null
      if (savedFavs && Array.isArray(savedFavs)) {
        dispatch({ type: 'SET_FAVORITES', favorites: savedFavs })
      } else {
        // Default favorites
        const defaultFavs: FavoriteFolder[] = [
          { name: 'Home', path: homeDir },
          { name: 'Desktop', path: `${homeDir}/Desktop` },
          { name: 'Documents', path: `${homeDir}/Documents` },
          { name: 'Downloads', path: `${homeDir}/Downloads` },
        ]
        dispatch({ type: 'SET_FAVORITES', favorites: defaultFavs })
        await window.electronAPI.configSet('favorites', defaultFavs)
      }

      // Load saved panel state (current path + pinned root path)
      const savedPanels = await window.electronAPI.configGet('panelState') as
        Array<{ currentPath: string; rootPath: string | null }> | null

      // Legacy fallback: plain array of path strings
      const legacyPaths = await window.electronAPI.configGet('panelPaths') as string[] | null

      let panelConfigs: Array<{ currentPath: string; rootPath: string | null }>

      if (savedPanels && Array.isArray(savedPanels) && savedPanels.length > 0) {
        panelConfigs = savedPanels.slice(0, 4)
      } else if (legacyPaths && Array.isArray(legacyPaths) && legacyPaths.length > 0) {
        panelConfigs = legacyPaths.slice(0, 4).map(p => ({ currentPath: p, rootPath: null }))
      } else {
        panelConfigs = [
          { currentPath: homeDir, rootPath: homeDir },
          { currentPath: `${homeDir}/Documents`, rootPath: `${homeDir}/Documents` },
        ]
      }

      for (const cfg of panelConfigs) {
        dispatch({ type: 'ADD_PANEL', path: cfg.currentPath, rootPath: cfg.rootPath })
      }
    }
    init()
  }, [])

  // Load entries whenever a panel's path changes
  useEffect(() => {
    for (const panel of state.panels) {
      if (panel.loading && panel.entries.length === 0) {
        loadPanel(panel.id, panel.currentPath)
      }
    }
  }, [state.panels, loadPanel])

  // Save panel state (current path + pinned root) when they change
  useEffect(() => {
    if (state.panels.length === 0) return
    const panelState = state.panels.map(p => ({
      currentPath: p.currentPath,
      rootPath: p.rootPath,
    }))
    window.electronAPI.configSet('panelState', panelState)
  }, [state.panels.map(p => `${p.currentPath}|${p.rootPath ?? ''}`).join(':')])

  return (
    <AppContext.Provider value={{ state, dispatch, loadPanel, refreshPanel, saveFavorites }}>
      {children}
    </AppContext.Provider>
  )
}

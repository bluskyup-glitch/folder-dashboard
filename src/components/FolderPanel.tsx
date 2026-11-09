import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useApp } from '../store/AppContext'
import type { FolderPanel as FolderPanelType, FileEntry, DragPayload } from '../types'
import { FileIconSvg } from './FileIcon'
import { Breadcrumb } from './Breadcrumb'
import { ContextMenu, type ContextMenuItem } from './ContextMenu'
import { VolumePicker } from './VolumePicker'
import { formatFileSize, formatDate, getFileCategory } from '../utils/fileUtils'

interface Props {
  panel: FolderPanelType
  onClose?: () => void
  canClose: boolean
}

interface ContextMenuState {
  x: number
  y: number
  entry: FileEntry | null
}

export function FolderPanel({ panel, onClose, canClose }: Props) {
  const { dispatch, state, refreshPanel } = useApp()
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [dragOverPanel, setDragOverPanel] = useState(false)
  const [notification, setNotification] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const isActive = state.activePanelId === panel.id

  const navigate = useCallback((path: string) => {
    dispatch({ type: 'NAVIGATE', panelId: panel.id, path })
  }, [dispatch, panel.id])

  const goBack = useCallback(() => {
    dispatch({ type: 'NAVIGATE_BACK', panelId: panel.id })
  }, [dispatch, panel.id])

  const goForward = useCallback(() => {
    dispatch({ type: 'NAVIGATE_FORWARD', panelId: panel.id })
  }, [dispatch, panel.id])

  const goUp = useCallback(() => {
    const parts = panel.currentPath.split('/').filter(Boolean)
    if (parts.length === 0) return
    const parent = '/' + parts.slice(0, -1).join('/')
    navigate(parent || '/')
  }, [panel.currentPath, navigate])

  const showNotification = (msg: string) => {
    setNotification(msg)
    setTimeout(() => setNotification(null), 2500)
  }

  // Handle entry double-click
  const handleDoubleClick = useCallback(async (entry: FileEntry) => {
    if (entry.isDirectory || entry.isSymlink) {
      navigate(entry.path)
    } else {
      await window.electronAPI.openFile(entry.path)
    }
  }, [navigate])

  // Handle entry click (selection)
  const handleClick = useCallback((e: React.MouseEvent, entry: FileEntry) => {
    e.stopPropagation()
    dispatch({ type: 'SET_ACTIVE_PANEL', panelId: panel.id })
    dispatch({
      type: 'TOGGLE_SELECTION',
      panelId: panel.id,
      path: entry.path,
      multi: e.metaKey || e.ctrlKey,
    })
  }, [dispatch, panel.id])

  // Clear selection when clicking empty space
  const handlePanelClick = useCallback(() => {
    dispatch({ type: 'SET_ACTIVE_PANEL', panelId: panel.id })
    dispatch({ type: 'CLEAR_SELECTION', panelId: panel.id })
  }, [dispatch, panel.id])

  // Context menu
  const handleContextMenu = useCallback((e: React.MouseEvent, entry: FileEntry | null) => {
    e.preventDefault()
    e.stopPropagation()
    dispatch({ type: 'SET_ACTIVE_PANEL', panelId: panel.id })
    if (entry && !panel.selectedPaths.has(entry.path)) {
      dispatch({ type: 'SET_SELECTION', panelId: panel.id, paths: new Set([entry.path]) })
    }
    setContextMenu({ x: e.clientX, y: e.clientY, entry })
  }, [dispatch, panel.id, panel.selectedPaths])

  // Copy/paste
  const handleCopy = useCallback(() => {
    const paths = panel.selectedPaths.size > 0
      ? Array.from(panel.selectedPaths)
      : contextMenu?.entry ? [contextMenu.entry.path] : []
    if (paths.length === 0) return
    dispatch({ type: 'SET_CLIPBOARD', clipboard: { paths, operation: 'copy' } })
    showNotification(`Copied ${paths.length} item${paths.length !== 1 ? 's' : ''}`)
  }, [dispatch, panel.selectedPaths, contextMenu])

  const handleCut = useCallback(() => {
    const paths = panel.selectedPaths.size > 0
      ? Array.from(panel.selectedPaths)
      : contextMenu?.entry ? [contextMenu.entry.path] : []
    if (paths.length === 0) return
    dispatch({ type: 'SET_CLIPBOARD', clipboard: { paths, operation: 'cut' } })
    showNotification(`Cut ${paths.length} item${paths.length !== 1 ? 's' : ''}`)
  }, [dispatch, panel.selectedPaths, contextMenu])

  const handlePaste = useCallback(async () => {
    const { clipboard } = state
    if (!clipboard || clipboard.paths.length === 0) return
    let success = 0
    for (const srcPath of clipboard.paths) {
      const stat = await window.electronAPI.stat(srcPath).catch(() => null)
      if (!stat) continue
      if (stat.isDirectory) {
        const res = await window.electronAPI.copyDir(srcPath, panel.currentPath)
        if (res.success) success++
      } else {
        const destFile = `${panel.currentPath}/${srcPath.split('/').pop()}`
        const res = clipboard.operation === 'cut'
          ? await window.electronAPI.moveFile(srcPath, panel.currentPath)
          : await window.electronAPI.copyFile(srcPath, destFile)
        if (res.success) success++
      }
    }
    if (clipboard.operation === 'cut') {
      dispatch({ type: 'SET_CLIPBOARD', clipboard: null })
    }
    refreshPanel(panel.id)
    showNotification(`Pasted ${success} item${success !== 1 ? 's' : ''}`)
  }, [state, panel.currentPath, panel.id, dispatch, refreshPanel])

  const handleDelete = useCallback(async () => {
    const paths = panel.selectedPaths.size > 0
      ? Array.from(panel.selectedPaths)
      : contextMenu?.entry ? [contextMenu.entry.path] : []
    if (paths.length === 0) return
    for (const p of paths) {
      await window.electronAPI.deleteFile(p)
    }
    refreshPanel(panel.id)
    showNotification(`Moved ${paths.length} item${paths.length !== 1 ? 's' : ''} to Trash`)
  }, [panel.selectedPaths, contextMenu, panel.id, refreshPanel])

  // Drag source
  const handleDragStart = useCallback((e: React.DragEvent, entry: FileEntry) => {
    const paths = panel.selectedPaths.has(entry.path)
      ? Array.from(panel.selectedPaths)
      : [entry.path]
    const payload: DragPayload = { paths, sourcePanelId: panel.id }
    e.dataTransfer.setData('application/x-folder-dashboard', JSON.stringify(payload))
    e.dataTransfer.effectAllowed = 'copyMove'
  }, [panel.selectedPaths, panel.id])

  // Drag target (panel)
  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('application/x-folder-dashboard')) {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'copy'
      setDragOverPanel(true)
    }
  }, [])

  const handleDragLeave = useCallback(() => setDragOverPanel(false), [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setDragOverPanel(false)
    const raw = e.dataTransfer.getData('application/x-folder-dashboard')
    if (!raw) return
    const payload: DragPayload = JSON.parse(raw)
    if (payload.sourcePanelId === panel.id) return
    const isCopy = e.altKey
    let success = 0
    for (const srcPath of payload.paths) {
      const stat = await window.electronAPI.stat(srcPath).catch(() => null)
      if (!stat) continue
      if (stat.isDirectory) {
        const res = await window.electronAPI.copyDir(srcPath, panel.currentPath)
        if (res.success) success++
      } else {
        if (isCopy) {
          const destFile = `${panel.currentPath}/${srcPath.split('/').pop()}`
          const res = await window.electronAPI.copyFile(srcPath, destFile)
          if (res.success) success++
        } else {
          const res = await window.electronAPI.moveFile(srcPath, panel.currentPath)
          if (res.success) success++
        }
      }
    }
    refreshPanel(panel.id)
    // Also refresh source panel
    dispatch({ type: 'REFRESH_PANEL', panelId: payload.sourcePanelId })
    showNotification(`${isCopy ? 'Copied' : 'Moved'} ${success} item${success !== 1 ? 's' : ''}`)
  }, [panel.currentPath, panel.id, refreshPanel, dispatch])

  // Add to favorites
  const handleAddToFavorites = useCallback(async (path: string) => {
    const stat = await window.electronAPI.stat(path).catch(() => null)
    if (!stat?.isDirectory) return
    const name = path.split('/').filter(Boolean).pop() || path
    dispatch({ type: 'ADD_FAVORITE', favorite: { name, path } })
    await window.electronAPI.configSet('favorites', [
      ...state.favorites,
      { name, path }
    ])
    showNotification(`Added "${name}" to favorites`)
  }, [dispatch, state.favorites])

  // Build context menu items
  const buildContextMenuItems = (): ContextMenuItem[] => {
    const entry = contextMenu?.entry || null
    const selectedCount = panel.selectedPaths.size
    const targetPaths = selectedCount > 0 ? Array.from(panel.selectedPaths) : entry ? [entry.path] : []
    const hasClipboard = (state.clipboard?.paths?.length ?? 0) > 0

    const items: ContextMenuItem[] = []

    if (entry) {
      if (entry.isDirectory) {
        items.push({ label: 'Open', icon: '📂', action: () => navigate(entry.path) })
        items.push({ label: 'Open in New Panel', icon: '🗂️', action: () => {
          dispatch({ type: 'ADD_PANEL', path: entry.path })
        }})
      } else {
        items.push({ label: 'Open', icon: '↗', action: () => window.electronAPI.openFile(entry.path) })
      }
      items.push({ separator: true })
    }

    if (entry?.isDirectory) {
      items.push({
        label: 'Add to Favorites',
        icon: '⭐',
        action: () => handleAddToFavorites(entry.path),
      })
      items.push({ separator: true })
    }

    items.push({
      label: selectedCount > 1 ? `Copy ${selectedCount} Items` : 'Copy',
      icon: '⎘',
      disabled: targetPaths.length === 0,
      action: handleCopy,
    })
    items.push({
      label: selectedCount > 1 ? `Cut ${selectedCount} Items` : 'Cut',
      icon: '✂️',
      disabled: targetPaths.length === 0,
      action: handleCut,
    })
    items.push({
      label: 'Paste',
      icon: '📋',
      disabled: !hasClipboard,
      action: handlePaste,
    })

    if (targetPaths.length > 0) {
      items.push({ separator: true })
      items.push({
        label: 'Show in Finder',
        icon: '🔍',
        action: () => window.electronAPI.showInFinder(targetPaths[0]),
      })
      items.push({
        label: selectedCount > 1 ? `Move ${selectedCount} Items to Trash` : 'Move to Trash',
        icon: '🗑️',
        danger: true,
        action: handleDelete,
      })
    }

    if (!entry) {
      items.push({ separator: true })
      items.push({
        label: 'Add Panel',
        icon: '＋',
        action: () => dispatch({ type: 'ADD_PANEL', path: panel.currentPath }),
      })
      items.push({
        label: 'Refresh',
        icon: '↺',
        action: () => refreshPanel(panel.id),
      })
    }

    return items
  }

  // Keyboard shortcuts when panel is active
  useEffect(() => {
    if (!isActive) return
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'c') { handleCopy(); e.preventDefault() }
      if ((e.metaKey || e.ctrlKey) && e.key === 'x') { handleCut(); e.preventDefault() }
      if ((e.metaKey || e.ctrlKey) && e.key === 'v') { handlePaste(); e.preventDefault() }
      if (e.key === 'Backspace' && !e.metaKey) { goBack(); e.preventDefault() }
      if (e.key === 'F5' || ((e.metaKey || e.ctrlKey) && e.key === 'r')) { refreshPanel(panel.id); e.preventDefault() }
      if (e.key === 'ArrowUp' && e.metaKey) { goUp(); e.preventDefault() }
      if (e.key === 'Delete' || (e.metaKey && e.key === 'Backspace')) { handleDelete(); e.preventDefault() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isActive, handleCopy, handleCut, handlePaste, goBack, goUp, refreshPanel, handleDelete, panel.id])

  const canGoBack = panel.historyIndex > 0
  const canGoForward = panel.historyIndex < panel.history.length - 1

  return (
    <div
      onClick={handlePanelClick}
      onContextMenu={e => handleContextMenu(e, null)}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: dragOverPanel ? 'var(--bg-drag-over)' : isActive ? 'var(--bg-surface)' : 'var(--bg-base)',
        border: `1px solid ${isActive ? '#3a3a60' : '#1e1e35'}`,
        borderRadius: 8,
        overflow: 'hidden',
        position: 'relative',
        transition: 'background 0.15s, border-color 0.15s',
        minWidth: 0,
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 10px',
          borderBottom: '1px solid #2a2a45',
          background: '#13132a',
          flexShrink: 0,
        }}
      >
        {/* Nav buttons */}
        <button
          onClick={e => { e.stopPropagation(); goBack() }}
          disabled={!canGoBack}
          title="Back"
          style={{
            width: 26, height: 26, borderRadius: 5,
            fontSize: 13, color: canGoBack ? '#8888aa' : '#33334a',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.1s, color 0.1s',
          }}
          onMouseEnter={e => canGoBack && ((e.currentTarget as HTMLElement).style.background = '#252540')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'none')}
        >‹</button>

        <button
          onClick={e => { e.stopPropagation(); goForward() }}
          disabled={!canGoForward}
          title="Forward"
          style={{
            width: 26, height: 26, borderRadius: 5,
            fontSize: 13, color: canGoForward ? '#8888aa' : '#33334a',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.1s, color 0.1s',
          }}
          onMouseEnter={e => canGoForward && ((e.currentTarget as HTMLElement).style.background = '#252540')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'none')}
        >›</button>

        <button
          onClick={e => { e.stopPropagation(); goUp() }}
          title="Up (⌘↑)"
          style={{
            width: 26, height: 26, borderRadius: 5,
            fontSize: 11, color: '#8888aa',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.1s',
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#252540')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'none')}
        >↑</button>

        <button
          onClick={e => { e.stopPropagation(); refreshPanel(panel.id) }}
          title="Refresh"
          style={{
            width: 26, height: 26, borderRadius: 5,
            fontSize: 13, color: '#8888aa',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.1s',
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#252540')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'none')}
        >↺</button>

        {/* Breadcrumb */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <Breadcrumb currentPath={panel.currentPath} onNavigate={navigate} />
        </div>

        {/* Volume picker */}
        <div onClick={e => e.stopPropagation()}>
          <VolumePicker currentPath={panel.currentPath} onNavigate={navigate} />
        </div>

        {/* Set root folder for this panel */}
        <button
          onClick={async e => {
            e.stopPropagation()
            const p = await window.electronAPI.openFolderDialog()
            if (p) {
              navigate(p)
              dispatch({ type: 'SET_PANEL_ROOT', panelId: panel.id, rootPath: p })
            }
          }}
          title="Set root folder for this panel (persists on restart)"
          style={{
            width: 26, height: 26, borderRadius: 5, fontSize: 13,
            color: panel.rootPath ? '#f0b429' : '#8888aa',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.1s, color 0.1s',
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#252540')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'none')}
        >📌</button>

        {/* Close panel */}
        {canClose && (
          <button
            onClick={e => { e.stopPropagation(); onClose?.() }}
            title="Close panel"
            style={{
              width: 22, height: 22, borderRadius: 4, fontSize: 12, color: '#555570',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.1s, color 0.1s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = '#3a1a1a'
              ;(e.currentTarget as HTMLElement).style.color = '#f87171'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'none'
              ;(e.currentTarget as HTMLElement).style.color = '#555570'
            }}
          >✕</button>
        )}
      </div>

      {/* File grid */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px',
        }}
        onScroll={e => {
          dispatch({ type: 'SET_SCROLL', panelId: panel.id, scrollTop: (e.target as HTMLElement).scrollTop })
        }}
      >
        {panel.loading && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 100, color: '#555570' }}>
            <span style={{ fontSize: 13 }}>Loading…</span>
          </div>
        )}

        {panel.error && (
          <div style={{
            margin: '20px auto', maxWidth: 300, padding: 16,
            background: '#2a1a1a', border: '1px solid #5a2a2a',
            borderRadius: 8, color: '#f87171', fontSize: 13,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 20, marginBottom: 8 }}>⚠️</div>
            <div>{panel.error}</div>
          </div>
        )}

        {!panel.loading && !panel.error && panel.entries.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 120, color: '#555570' }}>
            <span style={{ fontSize: 28, marginBottom: 8 }}>📂</span>
            <span style={{ fontSize: 13 }}>Empty folder</span>
          </div>
        )}

        {!panel.loading && !panel.error && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))',
              gap: '4px',
            }}
          >
            {panel.entries.map(entry => (
              <FileItem
                key={entry.path}
                entry={entry}
                selected={panel.selectedPaths.has(entry.path)}
                onClick={handleClick}
                onDoubleClick={handleDoubleClick}
                onContextMenu={handleContextMenu}
                onDragStart={handleDragStart}
              />
            ))}
          </div>
        )}
      </div>

      {/* Status bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '4px 12px',
          borderTop: '1px solid #1e1e35',
          fontSize: 11,
          color: '#555570',
          flexShrink: 0,
          background: '#0f0f1a',
          gap: 8,
        }}
      >
        <span>
          {panel.entries.length} items
          {panel.selectedPaths.size > 0 && ` · ${panel.selectedPaths.size} selected`}
        </span>
        {dragOverPanel && (
          <span style={{ color: '#6c63ff' }}>Drop to {state.clipboard ? 'move' : 'copy'} here</span>
        )}
        {state.clipboard && (
          <span style={{ color: '#6c63ff' }}>
            {state.clipboard.operation === 'cut' ? '✂️' : '⎘'} {state.clipboard.paths.length} in clipboard
          </span>
        )}
      </div>

      {/* Drop overlay */}
      {dragOverPanel && (
        <div
          style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            border: '2px dashed #6c63ff', borderRadius: 8,
            background: 'rgba(108,99,255,0.05)',
          }}
        />
      )}

      {/* Toast notification */}
      {notification && (
        <div
          style={{
            position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)',
            background: '#252540', border: '1px solid #3a3a60',
            color: '#e8e8f0', fontSize: 12, padding: '6px 14px',
            borderRadius: 20, boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
            whiteSpace: 'nowrap', zIndex: 100,
            animation: 'fadeIn 0.2s ease',
          }}
        >
          {notification}
        </div>
      )}

      {/* Context menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={buildContextMenuItems()}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  )
}

// ─── File Item ────────────────────────────────────────────────────────────────

interface FileItemProps {
  entry: FileEntry
  selected: boolean
  onClick: (e: React.MouseEvent, entry: FileEntry) => void
  onDoubleClick: (entry: FileEntry) => void
  onContextMenu: (e: React.MouseEvent, entry: FileEntry) => void
  onDragStart: (e: React.DragEvent, entry: FileEntry) => void
}

const FileItem = React.memo(function FileItem({
  entry, selected, onClick, onDoubleClick, onContextMenu, onDragStart,
}: FileItemProps) {
  const [hovered, setHovered] = useState(false)
  const truncatedName = entry.name.length > 18
    ? entry.name.slice(0, 16) + '…'
    : entry.name

  const bg = selected
    ? 'rgba(108,99,255,0.25)'
    : hovered
    ? 'rgba(255,255,255,0.05)'
    : 'transparent'

  return (
    <div
      draggable
      title={entry.name}
      onClick={e => onClick(e, entry)}
      onDoubleClick={() => onDoubleClick(entry)}
      onContextMenu={e => onContextMenu(e, entry)}
      onDragStart={e => onDragStart(e, entry)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '8px 4px 6px',
        borderRadius: 6,
        cursor: 'default',
        background: bg,
        border: selected ? '1px solid rgba(108,99,255,0.4)' : '1px solid transparent',
        transition: 'background 0.1s, border-color 0.1s',
        userSelect: 'none',
      }}
    >
      <FileIconSvg entry={entry} size={48} />
      <span
        style={{
          marginTop: 5,
          fontSize: 11,
          color: selected ? '#c8c8ff' : '#c8c8e0',
          textAlign: 'center',
          lineHeight: 1.3,
          wordBreak: 'break-word',
          maxWidth: '100%',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        } as React.CSSProperties}
      >
        {entry.name}
      </span>
      {!entry.isDirectory && (
        <span style={{ fontSize: 10, color: '#444460', marginTop: 1 }}>
          {formatFileSize(entry.size)}
        </span>
      )}
    </div>
  )
})

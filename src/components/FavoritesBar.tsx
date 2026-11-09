import React, { useState, useRef } from 'react'
import { useApp } from '../store/AppContext'
import type { FavoriteFolder } from '../types'
import { ContextMenu, type ContextMenuItem } from './ContextMenu'

interface Props {
  onNavigate: (path: string) => void
}

export function FavoritesBar({ onNavigate }: Props) {
  const { state, saveFavorites, dispatch } = useApp()
  const { favorites } = state
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; fav: FavoriteFolder } | null>(null)
  const [dragOver, setDragOver] = useState<string | null>(null)
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  const handleFavClick = (fav: FavoriteFolder) => {
    onNavigate(fav.path)
  }

  const handleAddFavorite = async () => {
    const path = await window.electronAPI.openFolderDialog()
    if (!path) return
    const name = path.split('/').filter(Boolean).pop() || path
    const newFav: FavoriteFolder = { name, path }
    const updated = [...favorites, newFav]
    saveFavorites(updated)
  }

  const handleContextMenu = (e: React.MouseEvent, fav: FavoriteFolder) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ x: e.clientX, y: e.clientY, fav })
  }

  const contextMenuItems = contextMenu ? [
    {
      label: 'Open in Panel',
      icon: '📂',
      action: () => onNavigate(contextMenu.fav.path),
    },
    { separator: true },
    {
      label: 'Remove from Favorites',
      icon: '✕',
      danger: true,
      action: () => {
        const updated = favorites.filter(f => f.path !== contextMenu.fav.path)
        saveFavorites(updated)
      },
    },
  ] satisfies ContextMenuItem[] : []

  // Drag-to-reorder
  const handleDragStart = (index: number) => setDragIndex(index)
  const handleDragOver = (e: React.DragEvent, path: string) => {
    e.preventDefault()
    setDragOver(path)
  }
  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    if (dragIndex === null || dragIndex === targetIndex) return
    const updated = [...favorites]
    const [moved] = updated.splice(dragIndex, 1)
    updated.splice(targetIndex, 0, moved)
    saveFavorites(updated)
    setDragIndex(null)
    setDragOver(null)
  }
  const handleDragEnd = () => {
    setDragIndex(null)
    setDragOver(null)
  }

  // Drop external files to add as favorites
  const handleExternalDrop = async (e: React.DragEvent, index: number) => {
    const paths = JSON.parse(e.dataTransfer.getData('application/x-folder-dashboard') || 'null') as { paths: string[] } | null
    if (!paths) return
    e.preventDefault()
    for (const p of paths.paths) {
      const stat = await window.electronAPI.stat(p)
      if (stat.isDirectory) {
        const name = p.split('/').filter(Boolean).pop() || p
        dispatch({ type: 'ADD_FAVORITE', favorite: { name, path: p } })
      }
    }
    const updated = [...favorites]
    saveFavorites(updated)
  }

  return (
    <aside
      style={{
        width: 200,
        flexShrink: 0,
        background: '#13132a',
        borderRight: '1px solid #2a2a45',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 14px 8px',
          fontSize: 11,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: '#555570',
          WebkitAppRegion: 'drag',
        } as React.CSSProperties}
      >
        Folder Dashboard
      </div>

      <div
        style={{
          padding: '4px 8px 6px',
          fontSize: 11,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: '#555570',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 4,
        }}
      >
        <span>Favorites</span>
        <button
          onClick={handleAddFavorite}
          title="Add folder to favorites"
          style={{
            width: 20,
            height: 20,
            borderRadius: 4,
            fontSize: 14,
            color: '#6c63ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#252540')}
          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
        >
          +
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '2px 6px' }}>
        {favorites.map((fav, i) => (
          <div
            key={fav.path}
            draggable
            onDragStart={() => handleDragStart(i)}
            onDragOver={e => handleDragOver(e, fav.path)}
            onDrop={e => handleDrop(e, i)}
            onDragEnd={handleDragEnd}
            onClick={() => handleFavClick(fav)}
            onContextMenu={e => handleContextMenu(e, fav)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 8px',
              borderRadius: 6,
              cursor: 'pointer',
              transition: 'background 0.12s',
              background: dragOver === fav.path ? 'rgba(108,99,255,0.15)' : 'none',
              marginBottom: 1,
              opacity: dragIndex === i ? 0.4 : 1,
            }}
            onMouseEnter={e => {
              if (dragOver !== fav.path) (e.currentTarget as HTMLElement).style.background = '#1e1e35'
            }}
            onMouseLeave={e => {
              if (dragOver !== fav.path) (e.currentTarget as HTMLElement).style.background = 'none'
            }}
          >
            <span style={{ fontSize: 14 }}>📁</span>
            <span
              style={{
                fontSize: 12,
                color: '#c8c8e0',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
              }}
            >
              {fav.name}
            </span>
          </div>
        ))}

        {favorites.length === 0 && (
          <div style={{ padding: '12px 8px', fontSize: 11, color: '#555570', textAlign: 'center' }}>
            No favorites yet.<br />Click + to add folders.
          </div>
        )}
      </div>

      {/* Bottom hint */}
      <div style={{ padding: '8px 14px', fontSize: 11, color: '#33334a', borderTop: '1px solid #1e1e35' }}>
        Drag folders here to pin
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenuItems}
          onClose={() => setContextMenu(null)}
        />
      )}
    </aside>
  )
}

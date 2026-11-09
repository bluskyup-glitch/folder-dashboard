import React, { useCallback, useRef, useState, useEffect } from 'react'
import { AppProvider, useApp } from './store/AppContext'
import { FolderPanel } from './components/FolderPanel'
import { FavoritesBar } from './components/FavoritesBar'
import { PanelDivider } from './components/PanelDivider'

function Dashboard() {
  const { state, dispatch } = useApp()
  const { panels, activePanelId } = state

  // Panel widths (flex values, null = equal)
  const [panelFlexes, setPanelFlexes] = useState<number[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef<{ index: number; startX: number; startFlexes: number[] } | null>(null)

  useEffect(() => {
    if (panels.length !== panelFlexes.length) {
      setPanelFlexes(new Array(panels.length).fill(1))
    }
  }, [panels.length])

  const handleNavigate = useCallback((path: string) => {
    // Navigate the active panel, or first panel
    const targetId = activePanelId || panels[0]?.id
    if (!targetId) return
    dispatch({ type: 'NAVIGATE', panelId: targetId, path })
  }, [dispatch, activePanelId, panels])

  const handleClosePanel = useCallback((panelId: string) => {
    dispatch({ type: 'REMOVE_PANEL', panelId })
  }, [dispatch])

  const handleAddPanel = useCallback(() => {
    const lastPanel = panels[panels.length - 1]
    dispatch({ type: 'ADD_PANEL', path: lastPanel?.currentPath })
  }, [dispatch, panels])

  // Drag-to-resize dividers
  const handleDividerMouseDown = useCallback((e: React.MouseEvent, index: number) => {
    e.preventDefault()
    draggingRef.current = {
      index,
      startX: e.clientX,
      startFlexes: [...panelFlexes],
    }

    const onMouseMove = (e: MouseEvent) => {
      if (!draggingRef.current || !containerRef.current) return
      const { index, startX, startFlexes } = draggingRef.current
      const containerWidth = containerRef.current.offsetWidth
      const totalFlex = startFlexes.reduce((a, b) => a + b, 0)
      const flexPerPx = totalFlex / containerWidth
      const delta = (e.clientX - startX) * flexPerPx

      const newFlexes = [...startFlexes]
      const minFlex = 0.15
      newFlexes[index] = Math.max(minFlex, startFlexes[index] + delta)
      newFlexes[index + 1] = Math.max(minFlex, startFlexes[index + 1] - delta)
      setPanelFlexes(newFlexes)
    }

    const onMouseUp = () => {
      draggingRef.current = null
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [panelFlexes])

  if (panels.length === 0) {
    return (
      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#555570' }}>
        <span>Loading…</span>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Sidebar */}
      <FavoritesBar onNavigate={handleNavigate} />

      {/* Main panel area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Top bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            padding: '6px 10px',
            borderBottom: '1px solid #1e1e35',
            background: '#0f0f1a',
            flexShrink: 0,
            WebkitAppRegion: 'drag',
          } as React.CSSProperties}
        >
          <div style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
            <button
              onClick={handleAddPanel}
              disabled={panels.length >= 4}
              title="Add panel (max 4)"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 10px',
                borderRadius: 5,
                fontSize: 12,
                color: panels.length >= 4 ? '#33334a' : '#8888aa',
                cursor: panels.length >= 4 ? 'default' : 'pointer',
                transition: 'background 0.1s, color 0.1s',
              }}
              onMouseEnter={e => panels.length < 4 && ((e.currentTarget as HTMLElement).style.background = '#252540')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'none')}
            >
              <span style={{ fontSize: 16, lineHeight: 1 }}>＋</span>
              <span>Add Panel</span>
              <span style={{ fontSize: 10, color: '#555570' }}>({panels.length}/4)</span>
            </button>
          </div>
        </div>

        {/* Panels */}
        <div
          ref={containerRef}
          style={{
            flex: 1,
            display: 'flex',
            overflow: 'hidden',
            padding: '8px',
            gap: 0,
          }}
        >
          {panels.map((panel, i) => (
            <React.Fragment key={panel.id}>
              <div
                style={{
                  flex: panelFlexes[i] ?? 1,
                  display: 'flex',
                  minWidth: 0,
                  overflow: 'hidden',
                }}
              >
                <FolderPanel
                  panel={panel}
                  canClose={panels.length > 1}
                  onClose={() => handleClosePanel(panel.id)}
                />
              </div>
              {i < panels.length - 1 && (
                <PanelDivider
                  onResizeStart={e => handleDividerMouseDown(e, i)}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(6px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Dashboard />
    </AppProvider>
  )
}

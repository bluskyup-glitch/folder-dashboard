import React, { useEffect, useRef, useState } from 'react'
import type { VolumeInfo } from '../types'

interface Props {
  currentPath: string
  onNavigate: (path: string) => void
}

export function VolumePicker({ currentPath, onNavigate }: Props) {
  const [open, setOpen] = useState(false)
  const [volumes, setVolumes] = useState<VolumeInfo[]>([])
  const ref = useRef<HTMLDivElement>(null)

  // Load volumes when dropdown opens
  useEffect(() => {
    if (!open) return
    window.electronAPI.listVolumes().then(setVolumes).catch(() => setVolumes([]))
  }, [open])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Find which volume we're currently on
  const activeVolume = volumes.find(v =>
    currentPath === v.path || currentPath.startsWith(v.path === '/' ? '/' : v.path + '/')
  )

  // Icon per volume type
  function volumeIcon(v: VolumeInfo) {
    if (v.isNetwork) return '🌐'
    if (v.isRemovable) return '💾'
    if (v.path === '/') return '💻'
    return '🖴'
  }

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
        title="Switch volume / drive"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '3px 7px',
          borderRadius: 5,
          fontSize: 11,
          color: open ? '#c8c8ff' : '#8888aa',
          background: open ? '#252540' : 'none',
          border: `1px solid ${open ? '#3a3a60' : 'transparent'}`,
          transition: 'all 0.12s',
          whiteSpace: 'nowrap',
          maxWidth: 110,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
        onMouseEnter={e => !open && ((e.currentTarget as HTMLElement).style.background = '#1e1e35')}
        onMouseLeave={e => !open && ((e.currentTarget as HTMLElement).style.background = 'none')}
      >
        <span style={{ fontSize: 12 }}>💻</span>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {activeVolume?.name ?? 'Volumes'}
        </span>
        <span style={{ fontSize: 9, opacity: 0.6, flexShrink: 0 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            zIndex: 9000,
            minWidth: 200,
            background: '#1e1e35',
            border: '1px solid #3a3a60',
            borderRadius: 8,
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            padding: '4px 0',
            animation: 'contextMenuIn 0.1s ease',
          }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{ padding: '4px 12px 6px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#555570' }}>
            Volumes
          </div>

          {volumes.length === 0 && (
            <div style={{ padding: '8px 14px', fontSize: 12, color: '#555570' }}>Loading…</div>
          )}

          {volumes.map(v => {
            const isActive = v.path === activeVolume?.path
            return (
              <button
                key={v.path}
                onClick={() => { onNavigate(v.path); setOpen(false) }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '7px 14px',
                  fontSize: 13,
                  color: isActive ? '#c8c8ff' : '#e8e8f0',
                  background: isActive ? 'rgba(108,99,255,0.15)' : 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => !isActive && ((e.currentTarget as HTMLElement).style.background = '#252540')}
                onMouseLeave={e => !isActive && ((e.currentTarget as HTMLElement).style.background = 'none')}
              >
                <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{volumeIcon(v)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: isActive ? 500 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {v.name}
                  </div>
                  <div style={{ fontSize: 10, color: '#555570', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {v.path}
                  </div>
                </div>
                {isActive && <span style={{ fontSize: 10, color: '#6c63ff', flexShrink: 0 }}>●</span>}
              </button>
            )
          })}

          <div style={{ height: 1, background: '#2a2a45', margin: '4px 0' }} />
          <button
            onClick={async () => {
              const p = await window.electronAPI.openFolderDialog()
              if (p) { onNavigate(p); setOpen(false) }
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              width: '100%', padding: '7px 14px', fontSize: 13,
              color: '#8888aa', background: 'none', border: 'none',
              textAlign: 'left', cursor: 'pointer', transition: 'background 0.1s',
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#252540')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'none')}
          >
            <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>📂</span>
            Browse for folder…
          </button>
        </div>
      )}
    </div>
  )
}

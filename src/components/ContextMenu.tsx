import React, { useEffect, useRef } from 'react'

export interface ContextMenuItem {
  label?: string
  icon?: string
  action?: () => void
  disabled?: boolean
  danger?: boolean
  separator?: boolean
}

interface Props {
  x: number
  y: number
  items: ContextMenuItem[]
  onClose: () => void
}

export function ContextMenu({ x, y, items, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [onClose])

  // Adjust position to keep within viewport
  const menuWidth = 220
  const adjustedX = x + menuWidth > window.innerWidth ? x - menuWidth : x
  const estimatedHeight = items.length * 34
  const adjustedY = y + estimatedHeight > window.innerHeight ? y - estimatedHeight : y

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        top: adjustedY,
        left: adjustedX,
        zIndex: 9999,
        minWidth: menuWidth,
        background: '#1e1e35',
        border: '1px solid #3a3a60',
        borderRadius: 8,
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        padding: '4px 0',
        animation: 'contextMenuIn 0.1s ease',
      }}
    >
      <style>{`
        @keyframes contextMenuIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
      {items.map((item, i) => {
        if (item.separator) {
          return <div key={i} style={{ height: 1, background: '#2a2a45', margin: '4px 0' }} />
        }
        return (
          <button
            key={i}
            disabled={item.disabled}
            onClick={() => {
              if (!item.disabled) {
                item.action?.()
                onClose()
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              width: '100%',
              padding: '7px 14px',
              fontSize: 13,
              color: item.danger ? '#f87171' : item.disabled ? '#555570' : '#e8e8f0',
              cursor: item.disabled ? 'default' : 'pointer',
              background: 'none',
              border: 'none',
              textAlign: 'left',
              transition: 'background 0.1s',
            }}
            onMouseEnter={e => {
              if (!item.disabled) {
                (e.currentTarget as HTMLElement).style.background = '#252540'
              }
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'none'
            }}
          >
            {item.icon && <span style={{ width: 18, textAlign: 'center', fontSize: 14 }}>{item.icon}</span>}
            {item.label}
          </button>
        )
      })}
    </div>
  )
}

import React, { useEffect, useState } from 'react'
import type { BreadcrumbPart } from '../types'

interface Props {
  currentPath: string
  onNavigate: (path: string) => void
}

export function Breadcrumb({ currentPath, onNavigate }: Props) {
  const [parts, setParts] = useState<BreadcrumbPart[]>([])

  useEffect(() => {
    window.electronAPI.pathParts(currentPath).then(setParts)
  }, [currentPath])

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        overflow: 'hidden',
        flex: 1,
        minWidth: 0,
      }}
    >
      {parts.map((part, i) => {
        const isLast = i === parts.length - 1
        return (
          <React.Fragment key={part.path}>
            {i > 0 && (
              <span style={{ color: '#3a3a60', fontSize: 11, flexShrink: 0 }}>›</span>
            )}
            <button
              onClick={() => !isLast && onNavigate(part.path)}
              title={part.path}
              style={{
                fontSize: 12,
                color: isLast ? '#e8e8f0' : '#8888aa',
                background: 'none',
                border: 'none',
                cursor: isLast ? 'default' : 'pointer',
                padding: '2px 4px',
                borderRadius: 4,
                maxWidth: isLast ? 'none' : 80,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flexShrink: isLast ? 0 : 1,
                fontWeight: isLast ? 500 : 400,
                transition: 'background 0.1s, color 0.1s',
              }}
              onMouseEnter={e => {
                if (!isLast) {
                  (e.currentTarget as HTMLElement).style.background = '#252540'
                  ;(e.currentTarget as HTMLElement).style.color = '#e8e8f0'
                }
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = 'none'
                ;(e.currentTarget as HTMLElement).style.color = isLast ? '#e8e8f0' : '#8888aa'
              }}
            >
              {part.name}
            </button>
          </React.Fragment>
        )
      })}
    </div>
  )
}

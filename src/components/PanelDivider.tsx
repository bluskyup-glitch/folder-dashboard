import React, { useCallback, useRef } from 'react'

interface Props {
  onResizeStart: (e: React.MouseEvent) => void
}

export function PanelDivider({ onResizeStart }: Props) {
  const [active, setActive] = React.useState(false)

  const handleMouseDown = (e: React.MouseEvent) => {
    setActive(true)
    onResizeStart(e)
  }

  return (
    <div
      onMouseDown={handleMouseDown}
      style={{
        width: 8,
        flexShrink: 0,
        cursor: 'col-resize',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
        position: 'relative',
      }}
    >
      <div
        style={{
          width: 2,
          height: '60%',
          minHeight: 40,
          borderRadius: 1,
          background: active ? '#6c63ff' : '#2a2a45',
          transition: 'background 0.15s',
        }}
      />
    </div>
  )
}

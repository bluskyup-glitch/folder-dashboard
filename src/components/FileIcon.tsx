import React from 'react'
import type { FileEntry } from '../types'
import { getFileCategory, getFileCategoryColor } from '../utils/fileUtils'

interface Props {
  entry: FileEntry
  size?: number
}

const FolderSvg = ({ color }: { color: string }) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
    <rect x="2" y="14" width="44" height="30" rx="4" fill={color} opacity="0.9" />
    <path d="M2 18C2 15.8 3.8 14 6 14H20L24 18H42C44.2 18 46 19.8 46 22V40C46 42.2 44.2 44 42 44H6C3.8 44 2 42.2 2 40V18Z" fill={color} />
    <rect x="2" y="10" width="22" height="10" rx="3" fill={color} opacity="0.75" />
  </svg>
)

const ImageSvg = ({ color }: { color: string }) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
    <rect x="4" y="6" width="40" height="36" rx="4" fill="#1e1e35" stroke={color} strokeWidth="2" />
    <circle cx="15" cy="17" r="4" fill={color} opacity="0.8" />
    <path d="M4 32L14 22L22 30L30 20L44 36" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 34L14 22L22 30L30 20L44 36V38C44 40.2 42.2 42 40 42H8C5.8 42 4 40.2 4 38V34Z" fill={color} opacity="0.3" />
  </svg>
)

const VideoSvg = ({ color }: { color: string }) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
    <rect x="2" y="8" width="44" height="32" rx="4" fill="#1e1e35" stroke={color} strokeWidth="2" />
    <path d="M18 17L34 24L18 31V17Z" fill={color} opacity="0.9" />
  </svg>
)

const AudioSvg = ({ color }: { color: string }) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
    <rect x="4" y="6" width="40" height="36" rx="4" fill="#1e1e35" stroke={color} strokeWidth="2" />
    <circle cx="24" cy="24" r="8" fill={color} opacity="0.25" stroke={color} strokeWidth="2" />
    <circle cx="24" cy="24" r="3" fill={color} />
    <path d="M28 12V20" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    <path d="M32 10V22" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
  </svg>
)

const CodeSvg = ({ color }: { color: string }) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
    <rect x="4" y="6" width="40" height="36" rx="4" fill="#1e1e35" stroke={color} strokeWidth="2" />
    <path d="M16 19L9 24L16 29" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M32 19L39 24L32 29" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M26 15L22 33" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
  </svg>
)

const DocSvg = ({ color }: { color: string }) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
    <path d="M10 4H30L42 16V44H10V4Z" fill="#1e1e35" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    <path d="M29 4V16H41" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <line x1="16" y1="23" x2="32" y2="23" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <line x1="16" y1="29" x2="32" y2="29" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <line x1="16" y1="35" x2="26" y2="35" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
)

const ArchiveSvg = ({ color }: { color: string }) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
    <rect x="8" y="6" width="32" height="36" rx="3" fill="#1e1e35" stroke={color} strokeWidth="2" />
    <rect x="8" y="6" width="32" height="8" rx="3" fill={color} opacity="0.3" />
    <line x1="20" y1="6" x2="20" y2="42" stroke={color} strokeWidth="2" />
    <line x1="28" y1="6" x2="28" y2="42" stroke={color} strokeWidth="2" />
    <circle cx="24" cy="28" r="3" fill={color} opacity="0.8" />
  </svg>
)

const GenericFileSvg = ({ color }: { color: string }) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
    <path d="M10 4H28L42 18V44H10V4Z" fill="#1e1e35" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    <path d="M27 4V18H42" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
)

const SymlinkSvg = ({ color }: { color: string }) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
    <path d="M10 4H28L42 18V44H10V4Z" fill="#1e1e35" stroke={color} strokeWidth="2" strokeLinejoin="round" opacity="0.5" />
    <path d="M20 30C20 30 28 22 36 28" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    <path d="M32 24L36 28L32 32" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export function FileIconSvg({ entry, size = 48 }: Props) {
  const category = getFileCategory(entry.ext, entry.isDirectory, entry.isSymlink)
  const color = getFileCategoryColor(category)

  const iconStyle: React.CSSProperties = {
    width: size,
    height: size,
    flexShrink: 0,
  }

  switch (category) {
    case 'folder': return <div style={iconStyle}><FolderSvg color={color} /></div>
    case 'image': return <div style={iconStyle}><ImageSvg color={color} /></div>
    case 'video': return <div style={iconStyle}><VideoSvg color={color} /></div>
    case 'audio': return <div style={iconStyle}><AudioSvg color={color} /></div>
    case 'code': return <div style={iconStyle}><CodeSvg color={color} /></div>
    case 'document': return <div style={iconStyle}><DocSvg color={color} /></div>
    case 'archive': return <div style={iconStyle}><ArchiveSvg color={color} /></div>
    case 'symlink': return <div style={iconStyle}><SymlinkSvg color={color} /></div>
    default: return <div style={iconStyle}><GenericFileSvg color={color} /></div>
  }
}

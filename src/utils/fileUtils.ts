export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '—'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const val = bytes / Math.pow(1024, i)
  return `${val < 10 ? val.toFixed(1) : Math.round(val)} ${units[i]}`
}

export function formatDate(isoString: string): string {
  const d = new Date(isoString)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return d.toLocaleDateString()
}

export type FileCategory =
  | 'folder'
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'code'
  | 'archive'
  | 'font'
  | 'data'
  | 'executable'
  | 'symlink'
  | 'unknown'

export function getFileCategory(ext: string, isDirectory: boolean, isSymlink: boolean): FileCategory {
  if (isSymlink) return 'symlink'
  if (isDirectory) return 'folder'
  const e = ext.toLowerCase()
  const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp', '.ico', '.tiff', '.heic', '.avif']
  const videoExts = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv', '.wmv', '.m4v']
  const audioExts = ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a', '.wma', '.aiff']
  const docExts = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.rtf', '.md', '.pages', '.numbers', '.key']
  const codeExts = ['.js', '.ts', '.jsx', '.tsx', '.py', '.rb', '.go', '.rs', '.c', '.cpp', '.h', '.java', '.swift', '.kt', '.cs', '.php', '.html', '.css', '.scss', '.json', '.xml', '.yaml', '.yml', '.sh', '.bash', '.zsh', '.fish']
  const archiveExts = ['.zip', '.tar', '.gz', '.bz2', '.7z', '.rar', '.xz', '.dmg', '.pkg']
  const fontExts = ['.ttf', '.otf', '.woff', '.woff2', '.eot']
  const dataExts = ['.csv', '.sqlite', '.db', '.sql']
  const execExts = ['.app', '.exe', '.bin', '.command']

  if (imageExts.includes(e)) return 'image'
  if (videoExts.includes(e)) return 'video'
  if (audioExts.includes(e)) return 'audio'
  if (docExts.includes(e)) return 'document'
  if (codeExts.includes(e)) return 'code'
  if (archiveExts.includes(e)) return 'archive'
  if (fontExts.includes(e)) return 'font'
  if (dataExts.includes(e)) return 'data'
  if (execExts.includes(e)) return 'executable'
  return 'unknown'
}

export function getFileIconEmoji(category: FileCategory, ext: string): string {
  switch (category) {
    case 'folder': return '📁'
    case 'image': return '🖼️'
    case 'video': return '🎬'
    case 'audio': return '🎵'
    case 'document':
      if (ext === '.pdf') return '📕'
      if (['.xls', '.xlsx'].includes(ext)) return '📗'
      if (['.ppt', '.pptx'].includes(ext)) return '📙'
      return '📄'
    case 'code': return '💻'
    case 'archive': return '📦'
    case 'font': return '🔤'
    case 'data': return '🗄️'
    case 'executable': return '⚙️'
    case 'symlink': return '🔗'
    default: return '📄'
  }
}

export function getFileCategoryColor(category: FileCategory): string {
  switch (category) {
    case 'folder': return '#f0b429'
    case 'image': return '#22d3ee'
    case 'video': return '#a78bfa'
    case 'audio': return '#fb7185'
    case 'document': return '#60a5fa'
    case 'code': return '#34d399'
    case 'archive': return '#fb923c'
    case 'font': return '#e879f9'
    case 'data': return '#a3e635'
    case 'executable': return '#f87171'
    case 'symlink': return '#94a3b8'
    default: return '#8888aa'
  }
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10)
}

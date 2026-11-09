export interface FileEntry {
  name: string
  path: string
  isDirectory: boolean
  isSymlink: boolean
  size: number
  modified: string
  ext: string
}

export interface BreadcrumbPart {
  name: string
  path: string
}

export interface FolderPanel {
  id: string
  currentPath: string
  rootPath: string | null  // persisted starting folder for this panel slot
  history: string[]
  historyIndex: number
  entries: FileEntry[]
  loading: boolean
  error: string | null
  selectedPaths: Set<string>
  scrollTop: number
}

export interface FavoriteFolder {
  name: string
  path: string
}

export interface ClipboardItem {
  paths: string[]
  operation: 'copy' | 'cut'
}

export interface DragPayload {
  paths: string[]
  sourcePanelId: string
}

export type ViewMode = 'grid' | 'list'

export interface VolumeInfo {
  name: string
  path: string
  isRemovable: boolean
  isNetwork: boolean
}

declare global {
  interface Window {
    electronAPI: {
      readDir: (dirPath: string) => Promise<FileEntry[]>
      homeDir: () => Promise<string>
      pathSep: () => Promise<string>
      pathParts: (dirPath: string) => Promise<BreadcrumbPart[]>
      stat: (filePath: string) => Promise<{
        size: number
        modified: string
        created: string
        isDirectory: boolean
      }>
      openFile: (filePath: string) => Promise<{ success: boolean; error?: string }>
      copyFile: (src: string, dest: string) => Promise<{ success: boolean; dest?: string; error?: string }>
      copyDir: (src: string, dest: string) => Promise<{ success: boolean; dest?: string; error?: string }>
      moveFile: (src: string, dest: string) => Promise<{ success: boolean; dest?: string; error?: string }>
      deleteFile: (filePath: string) => Promise<{ success: boolean; error?: string }>
      showInFinder: (filePath: string) => Promise<{ success: boolean }>
      openFolderDialog: () => Promise<string | null>
      listVolumes: () => Promise<VolumeInfo[]>
      configGet: (key: string) => Promise<unknown>
      configSet: (key: string, value: unknown) => Promise<boolean>
    }
  }
}

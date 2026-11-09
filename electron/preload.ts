import { contextBridge, ipcRenderer } from 'electron'

const api = {
  // Directory operations
  readDir: (dirPath: string) => ipcRenderer.invoke('fs:readDir', dirPath),
  homeDir: () => ipcRenderer.invoke('fs:homeDir'),
  pathSep: () => ipcRenderer.invoke('fs:pathSep'),
  pathParts: (dirPath: string) => ipcRenderer.invoke('fs:pathParts', dirPath),
  stat: (filePath: string) => ipcRenderer.invoke('fs:stat', filePath),

  // File operations
  openFile: (filePath: string) => ipcRenderer.invoke('fs:openFile', filePath),
  copyFile: (src: string, dest: string) => ipcRenderer.invoke('fs:copyFile', src, dest),
  copyDir: (src: string, dest: string) => ipcRenderer.invoke('fs:copyDir', src, dest),
  moveFile: (src: string, dest: string) => ipcRenderer.invoke('fs:moveFile', src, dest),
  deleteFile: (filePath: string) => ipcRenderer.invoke('fs:deleteFile', filePath),
  showInFinder: (filePath: string) => ipcRenderer.invoke('fs:showInFinder', filePath),

  // Dialogs
  openFolderDialog: () => ipcRenderer.invoke('dialog:openFolder'),

  // Config / favorites
  configGet: (key: string) => ipcRenderer.invoke('config:get', key),
  configSet: (key: string, value: unknown) => ipcRenderer.invoke('config:set', key, value),
}

contextBridge.exposeInMainWorld('electronAPI', api)

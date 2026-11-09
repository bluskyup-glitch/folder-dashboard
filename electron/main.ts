import { app, BrowserWindow, ipcMain, shell, dialog, Menu } from 'electron'
import * as path from 'path'
import * as fs from 'fs'
import * as os from 'os'

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#1a1a2e',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Remove default menu
  Menu.setApplicationMenu(null)
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (mainWindow === null) createWindow()
})

// ─── IPC: Directory Reading ───────────────────────────────────────────────────

ipcMain.handle('fs:readDir', async (_event, dirPath: string) => {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
    return entries
      .filter(e => !e.name.startsWith('.'))
      .map(entry => {
        const fullPath = path.join(dirPath, entry.name)
        let size = 0
        let modified = new Date()
        try {
          const stat = fs.statSync(fullPath)
          size = stat.size
          modified = stat.mtime
        } catch {}
        return {
          name: entry.name,
          path: fullPath,
          isDirectory: entry.isDirectory(),
          isSymlink: entry.isSymbolicLink(),
          size,
          modified: modified.toISOString(),
          ext: entry.isDirectory() ? '' : path.extname(entry.name).toLowerCase(),
        }
      })
      .sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1
        if (!a.isDirectory && b.isDirectory) return 1
        return a.name.localeCompare(b.name)
      })
  } catch (err: any) {
    throw new Error(err.message)
  }
})

ipcMain.handle('fs:homeDir', () => os.homedir())

ipcMain.handle('fs:pathSep', () => path.sep)

ipcMain.handle('fs:pathParts', (_event, dirPath: string) => {
  const parts: { name: string; path: string }[] = []
  const segments = dirPath.split(path.sep).filter(Boolean)
  if (process.platform !== 'win32') {
    parts.push({ name: '/', path: '/' })
  }
  let current = process.platform !== 'win32' ? '/' : ''
  for (const seg of segments) {
    current = path.join(current, seg)
    parts.push({ name: seg, path: current })
  }
  return parts
})

// ─── IPC: File Operations ────────────────────────────────────────────────────

ipcMain.handle('fs:openFile', async (_event, filePath: string) => {
  try {
    await shell.openPath(filePath)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('fs:copyFile', async (_event, src: string, dest: string) => {
  try {
    const destStat = fs.existsSync(dest)
    if (destStat) {
      const ext = path.extname(dest)
      const base = dest.slice(0, dest.length - ext.length)
      dest = `${base} copy${ext}`
    }
    fs.copyFileSync(src, dest)
    return { success: true, dest }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('fs:copyDir', async (_event, src: string, dest: string) => {
  try {
    const destName = path.basename(src)
    const finalDest = path.join(dest, destName)
    copyDirRecursive(src, finalDest)
    return { success: true, dest: finalDest }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
})

function copyDirRecursive(src: string, dest: string) {
  fs.mkdirSync(dest, { recursive: true })
  const entries = fs.readdirSync(src, { withFileTypes: true })
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

ipcMain.handle('fs:moveFile', async (_event, src: string, dest: string) => {
  try {
    const destFile = path.join(dest, path.basename(src))
    fs.renameSync(src, destFile)
    return { success: true, dest: destFile }
  } catch (err: any) {
    // Cross-device move: copy then delete
    try {
      const destFile = path.join(dest, path.basename(src))
      const stat = fs.statSync(src)
      if (stat.isDirectory()) {
        copyDirRecursive(src, destFile)
        fs.rmSync(src, { recursive: true })
      } else {
        fs.copyFileSync(src, destFile)
        fs.unlinkSync(src)
      }
      return { success: true, dest: destFile }
    } catch (err2: any) {
      return { success: false, error: err2.message }
    }
  }
})

ipcMain.handle('fs:deleteFile', async (_event, filePath: string) => {
  try {
    const result = await shell.trashItem(filePath)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('fs:showInFinder', async (_event, filePath: string) => {
  shell.showItemInFolder(filePath)
  return { success: true }
})

ipcMain.handle('fs:stat', async (_event, filePath: string) => {
  try {
    const stat = fs.statSync(filePath)
    return {
      size: stat.size,
      modified: stat.mtime.toISOString(),
      created: stat.birthtime.toISOString(),
      isDirectory: stat.isDirectory(),
    }
  } catch (err: any) {
    throw new Error(err.message)
  }
})

ipcMain.handle('dialog:openFolder', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory'],
  })
  if (result.canceled || result.filePaths.length === 0) return null
  return result.filePaths[0]
})

// ─── IPC: Config / Favorites ─────────────────────────────────────────────────

const configPath = path.join(app.getPath('userData'), 'config.json')

function readConfig(): Record<string, unknown> {
  try {
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    }
  } catch {}
  return {}
}

function writeConfig(data: Record<string, unknown>) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(data, null, 2), 'utf-8')
  } catch {}
}

ipcMain.handle('config:get', async (_event, key: string) => {
  const config = readConfig()
  return config[key] ?? null
})

ipcMain.handle('config:set', async (_event, key: string, value: unknown) => {
  const config = readConfig()
  config[key] = value
  writeConfig(config)
  return true
})

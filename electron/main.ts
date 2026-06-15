import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import path from 'path'

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1200,
    minHeight: 720,
    title: 'PC Builder Pro - 电脑装机配置专家',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
    win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

ipcMain.handle('print-quote', async (_event, htmlContent: string) => {
  const printWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  printWindow.loadURL(
    'data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent)
  )

  return new Promise((resolve) => {
    printWindow.webContents.on('did-finish-load', () => {
      printWindow.webContents.print(
        {
          silent: false,
          printBackground: true,
        },
        (success, errorType) => {
          printWindow.close()
          resolve({ success, errorType })
        }
      )
    })
  })
})

import { app, BrowserWindow, ipcMain, dialog, shell, Notification, Tray, Menu } from 'electron';
import path from 'path';
import { BackendManager } from './backend-manager';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
const backendManager = new BackendManager(52522);

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    frame: true,
    title: 'LANShare - Professional Local File Transfer',
    backgroundColor: '#F5F7FC',
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  const isDev = !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', '..', 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function setupIPC() {
  // Select multiple files
  ipcMain.handle('dialog:select-files', async () => {
    if (!mainWindow) return [];
    const res = await dialog.showOpenDialog(mainWindow, {
      title: 'Select Files to Send',
      properties: ['openFile', 'multiSelections']
    });
    return res.canceled ? [] : res.filePaths;
  });

  // Select folder
  ipcMain.handle('dialog:select-folder', async () => {
    if (!mainWindow) return null;
    const res = await dialog.showOpenDialog(mainWindow, {
      title: 'Select Folder',
      properties: ['openDirectory']
    });
    return res.canceled || res.filePaths.length === 0 ? null : res.filePaths[0];
  });

  // Open directory in native Explorer
  ipcMain.handle('shell:open-folder', async (_, folderPath: string) => {
    try {
      await shell.openPath(folderPath);
      return true;
    } catch {
      return false;
    }
  });

  // App version
  ipcMain.handle('app:get-version', () => app.getVersion());

  // Show desktop notification
  ipcMain.handle('app:notification', (_, { title, body }) => {
    if (Notification.isSupported()) {
      new Notification({ title, body }).show();
    }
  });
}

// App lifecycle
app.whenReady().then(async () => {
  setupIPC();
  await backendManager.start();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    backendManager.stop();
    app.quit();
  }
});

app.on('will-quit', () => {
  backendManager.stop();
});

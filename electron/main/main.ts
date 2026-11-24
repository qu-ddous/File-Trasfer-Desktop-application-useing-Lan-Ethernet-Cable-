import { app, BrowserWindow, ipcMain, dialog, shell, Notification, Tray, Menu } from 'electron';
import path from 'path';
import { BackendManager } from './backend-manager';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
const backendManager = new BackendManager(52522);

// Detect mode from process executable name or CLI flag
const execName = path.basename(process.execPath).toLowerCase();
const appMode = process.argv.includes('--server') || execName.includes('server') 
  ? 'server' 
  : (process.argv.includes('--client') || execName.includes('client') ? 'client' : 'full');

function createWindow() {
  const windowTitle = appMode === 'server'
    ? 'LANShare - Server Receiver'
    : (appMode === 'client' ? 'LANShare - Client Sender' : 'LANShare - Professional Local File Transfer');

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    frame: true,
    title: windowTitle,
    backgroundColor: '#F8FAFC',
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  const isDev = !app.isPackaged;
  const indexPath = path.join(__dirname, '..', '..', 'dist', 'index.html');
  console.log('[Main] Loading UI from:', indexPath);

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(indexPath).catch((err) => {
      console.error('[Main] Failed to loadFile:', err);
    });
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

  // App mode ('server' | 'client' | 'full')
  ipcMain.handle('app:get-mode', () => appMode);

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

import { app, BrowserWindow, ipcMain, dialog, shell, Notification, Tray, Menu } from 'electron';
import path from 'path';
import { BackendManager } from './backend-manager';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
const backendManager = new BackendManager(52522);

// Unified Application Mode
const execName = path.basename(process.execPath).toLowerCase();
const appMode = process.argv.includes('--server')
  ? 'server' 
  : (process.argv.includes('--client') ? 'client' : 'full');

function createWindow() {
  const windowTitle = 'WireDrop - Professional Wire & LAN File Transfer';

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

  mainWindow.webContents.on('before-input-event', (event, input) => {
    if ((input.key === 'F12' || (input.control && input.shift && input.key.toLowerCase() === 'i')) && input.type === 'keyDown') {
      mainWindow?.webContents.toggleDevTools();
      event.preventDefault();
    }
  });

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

  // Toggle DevTools
  ipcMain.handle('app:toggle-devtools', () => {
    if (mainWindow) {
      mainWindow.webContents.toggleDevTools();
    }
  });

  // 1-Click Windows Defender Firewall configuration
  ipcMain.handle('system:fix-firewall', async () => {
    return new Promise((resolve) => {
      const psScript = "Start-Process powershell -Verb RunAs -ArgumentList '-NoProfile -Command \"netsh advfirewall firewall add rule name=\\\"WireDrop Transfer TCP 52521\\\" dir=in action=allow protocol=TCP localport=52521 profile=any; netsh advfirewall firewall add rule name=\\\"WireDrop Discovery UDP 52520\\\" dir=in action=allow protocol=UDP localport=52520 profile=any; netsh advfirewall firewall add rule name=\\\"WireDrop Web Share TCP 52522\\\" dir=in action=allow protocol=TCP localport=52522 profile=any\"'";
      const { exec } = require('child_process');
      exec(`powershell.exe -NoProfile -Command "${psScript}"`, (err: any) => {
        if (err) {
          console.error('[Main] Failed to configure firewall:', err);
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
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

import { contextBridge, ipcRenderer } from 'electron';

export interface ElectronAPI {
  selectFiles: () => Promise<string[]>;
  selectFolder: () => Promise<string | null>;
  openFolder: (folderPath: string) => Promise<boolean>;
  getAppVersion: () => Promise<string>;
  showNotification: (title: string, body: string) => Promise<void>;
  getAppMode: () => Promise<string>;
  toggleDevTools: () => Promise<void>;
  fixFirewall: () => Promise<boolean>;
}

const api: ElectronAPI = {
  selectFiles: () => ipcRenderer.invoke('dialog:select-files'),
  selectFolder: () => ipcRenderer.invoke('dialog:select-folder'),
  openFolder: (folderPath: string) => ipcRenderer.invoke('shell:open-folder', folderPath),
  getAppVersion: () => ipcRenderer.invoke('app:get-version'),
  showNotification: (title: string, body: string) => ipcRenderer.invoke('app:notification', { title, body }),
  getAppMode: () => ipcRenderer.invoke('app:get-mode'),
  toggleDevTools: () => ipcRenderer.invoke('app:toggle-devtools'),
  fixFirewall: () => ipcRenderer.invoke('system:fix-firewall')
};

contextBridge.exposeInMainWorld('electronAPI', api);

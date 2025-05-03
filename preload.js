const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openLocalFile: () => ipcRenderer.invoke('open-local-file')
});

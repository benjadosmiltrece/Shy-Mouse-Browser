const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    saveTabs: (tabs, currentIndex) => ipcRenderer.invoke('save-tabs', { tabs, currentIndex }),
    loadTabs: () => ipcRenderer.invoke('load-tabs'),
    openLocalFile: () => ipcRenderer.invoke('dialog:openFile'),
    onSaveBeforeClose: (callback) => ipcRenderer.on('save-tabs-before-close', callback)
});
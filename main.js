const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

const { ipcMain, dialog } = require('electron');

ipcMain.handle('open-local-file', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'HTML files', extensions: ['html', 'htm'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  return 'file://' + result.filePaths[0];
});




function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, 'assets', 'browser-logo.png'), // ← here
    webPreferences: {
      nodeIntegration: false,    // best practice: isolate your UI from Node
      contextIsolation: true,
      webviewTag: true,
      preload: path.join(__dirname, 'preload.js')
    },
  });

  win.loadFile('index.html');
  // Optionally hide the default menu:
  Menu.setApplicationMenu(null);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});


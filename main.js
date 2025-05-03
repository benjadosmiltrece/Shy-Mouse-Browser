const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { ElectronBlocker } = require('@cliqz/adblocker-electron');

// Tab persistence functions
function saveTabs(tabs, currentIndex) {
    try {
        const data = JSON.stringify({
            tabs: tabs.map(t => ({
                url: t.url,
                title: t.title
            })),
            currentIndex
        });
        const userDataPath = app.getPath('userData');
        fs.writeFileSync(path.join(userDataPath, 'tabs.json'), data);
    } catch (err) {
        console.error('Save error:', err);
    }
}

function loadTabs() {
    try {
        const userDataPath = app.getPath('userData');
        const tabsPath = path.join(userDataPath, 'tabs.json');
        return fs.existsSync(tabsPath) 
            ? JSON.parse(fs.readFileSync(tabsPath, 'utf-8')) 
            : null;
    } catch (err) {
        console.error('Load error:', err);
        return null;
    }
}

// IPC Handlers
ipcMain.handle('dialog:openFile', async () => {
    const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
            { name: 'HTML files', extensions: ['html', 'htm'] },
            { name: 'All Files', extensions: ['*'] }
        ]
    });
    return result.canceled ? null : 'file://' + result.filePaths[0];
});

ipcMain.handle('save-tabs', (_, data) => saveTabs(data.tabs, data.currentIndex));
ipcMain.handle('load-tabs', loadTabs);

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        icon: path.join(__dirname, 'assets', 'browser-logo.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            webviewTag: true,
            preload: path.join(__dirname, 'preload.js')
        },
    });

    win.on('close', () => {
        if (!win.isDestroyed()) {
            win.webContents.send('save-tabs-before-close');
        }
    });

    win.maximize();
    win.loadFile('index.html');
    Menu.setApplicationMenu(null);

    ElectronBlocker.fromPrebuiltAdsAndTracking(fetch).then((blocker) => {
        blocker.enableBlockingInSession(win.webContents.session);
    });

    return win;
}

app.whenReady().then(() => {
    const mainWindow = createWindow();
    app.on('before-quit', () => {
        if (!mainWindow.isDestroyed()) {
            mainWindow.webContents.send('save-tabs-before-close');
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
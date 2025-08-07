const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { getSetting, setSetting } = require('./services/settingsService');
const { openSingleFile, openDirectoryOfFiles } = require('./services/filesService');
const datasets = require('./services/datasetsService');

function createMainWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      enableRemoteModule: false,
    },
    show: false,
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
}

app.whenReady().then(() => {
  createMainWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC namespaced
ipcMain.handle('settings:get', (_event, key) => getSetting(key));
ipcMain.handle('settings:set', (_event, key, value) => setSetting(key, value));
ipcMain.handle('files:openFile', async () => openSingleFile());
ipcMain.handle('files:openDirectory', async () => openDirectoryOfFiles());

ipcMain.handle('datasets:list', () => datasets.listDatasets());
ipcMain.handle('datasets:get', (_e, id) => datasets.getDataset(id));
ipcMain.handle('datasets:create', (_e, name, rows, source) => datasets.createDataset(name, rows, source));
ipcMain.handle('datasets:rename', (_e, id, newName) => datasets.renameDataset(id, newName));
ipcMain.handle('datasets:delete', (_e, id) => datasets.deleteDataset(id));
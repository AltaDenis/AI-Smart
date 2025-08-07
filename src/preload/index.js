const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getSetting: (key) => ipcRenderer.invoke('settings:get', key),
  setSetting: (key, value) => ipcRenderer.invoke('settings:set', key, value),
  openFile: () => ipcRenderer.invoke('files:openFile'),
  openDirectory: () => ipcRenderer.invoke('files:openDirectory'),
  datasets: {
    list: () => ipcRenderer.invoke('datasets:list'),
    get: (id) => ipcRenderer.invoke('datasets:get', id),
    create: (name, rows, source) => ipcRenderer.invoke('datasets:create', name, rows, source),
    rename: (id, newName) => ipcRenderer.invoke('datasets:rename', id, newName),
    delete: (id) => ipcRenderer.invoke('datasets:delete', id),
  },
  mappings: {
    get: (datasetId, reportId) => ipcRenderer.invoke('mappings:get', datasetId, reportId),
    set: (datasetId, reportId, mapping) => ipcRenderer.invoke('mappings:set', datasetId, reportId, mapping),
  }
});
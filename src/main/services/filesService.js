const { dialog } = require('electron');
const path = require('path');
const fs = require('fs');

function readFilePayload(filePath) {
  const data = fs.readFileSync(filePath).toString('base64');
  const ext = path.extname(filePath).slice(1).toLowerCase();
  const name = path.basename(filePath);
  return { path: filePath, name, data, ext };
}

async function openSingleFile() {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Data files', extensions: ['xlsx', 'xls', 'csv'] },
      { name: 'All files', extensions: ['*'] },
    ],
  });
  if (canceled || !filePaths || filePaths.length === 0) return null;
  return readFilePayload(filePaths[0]);
}

async function openDirectoryOfFiles() {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  });
  if (canceled || !filePaths || filePaths.length === 0) return null;
  const dir = filePaths[0];
  const allowed = new Set(['xlsx', 'xls', 'csv']);
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = entries
    .filter((e) => e.isFile())
    .map((e) => path.join(dir, e.name))
    .filter((p) => allowed.has(path.extname(p).slice(1).toLowerCase()));

  return files.map(readFilePayload);
}

module.exports = { openSingleFile, openDirectoryOfFiles };
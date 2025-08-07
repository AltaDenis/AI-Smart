const { contextBridge, ipcRenderer } = require('electron');
let XLSX;
try { XLSX = require('xlsx'); } catch (_) { XLSX = null; }

function normalizeHeaderCell(text) {
  if (text == null) return '';
  const t = String(text).replace(/\*/g, '').replace(/\s+/g, ' ').trim();
  return t;
}
function detectHeaderRow(rows, maxScan = 30) {
  const keyHints = ['Ваш SKU', 'Название товара', 'Категория', 'Цена', 'Индекс видимости'];
  let bestIdx = -1; let bestScore = -1;
  for (let i = 0; i < Math.min(rows.length, maxScan); i++) {
    const row = rows[i] || [];
    const cells = row.map(normalizeHeaderCell).filter(Boolean);
    const nonEmpty = cells.length;
    const hit = cells.reduce((a, c) => a + (keyHints.some(k => c.toLowerCase().includes(k.toLowerCase())) ? 1 : 0), 0);
    const score = hit * 10 + nonEmpty;
    if (score > bestScore && nonEmpty >= 3) { bestScore = score; bestIdx = i; }
  }
  return bestIdx >= 0 ? bestIdx : 0;
}
function rowsFromSheetSmart(ws) {
  if (!XLSX) return [];
  const matrix = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
  if (!matrix || matrix.length === 0) return [];
  const headerIdx = detectHeaderRow(matrix);
  const headerRow = (matrix[headerIdx] || []).map(normalizeHeaderCell);
  const cols = headerRow.map((h, idx) => h || `col_${idx+1}`);
  const dataRows = matrix.slice(headerIdx + 1);
  return dataRows
    .filter(r => (r || []).some(v => v !== null && v !== undefined && String(v).trim() !== ''))
    .map(r => {
      const obj = {};
      cols.forEach((c, i) => { obj[c] = r[i] ?? null; });
      return obj;
    });
}

async function parseWorkbook(base64, ext) {
  if (!XLSX) throw new Error('XLSX module not available');
  let wb;
  if (String(ext).toLowerCase() === 'csv') {
    const csvText = Buffer.from(base64, 'base64').toString('utf-8');
    wb = XLSX.read(csvText, { type: 'string' });
  } else {
    wb = XLSX.read(base64, { type: 'base64' });
  }
  const sheets = (wb.SheetNames || []).map(name => ({ name, rows: rowsFromSheetSmart(wb.Sheets[name]) }));
  return { sheetNames: wb.SheetNames || [], sheets };
}

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
  },
  parseWorkbook: (base64, ext) => parseWorkbook(base64, ext),
});
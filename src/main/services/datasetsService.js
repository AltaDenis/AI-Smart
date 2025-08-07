const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const Store = require('electron-store');

const datasetsStore = new Store({ name: 'datasets' });

function getDatasetsDir() {
  const dir = path.join(app.getPath('userData'), 'datasets');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function generateId() {
  return crypto.randomBytes(8).toString('hex');
}

function inferSchema(rows, sampleSize = 100) {
  const sample = rows.slice(0, sampleSize);
  const fieldNames = new Set();
  sample.forEach(r => Object.keys(r || {}).forEach(k => fieldNames.add(k)));
  const result = [];
  for (const field of fieldNames) {
    let type = 'string';
    for (const r of sample) {
      const v = r ? r[field] : undefined;
      if (v === null || v === undefined || v === '') continue;
      if (typeof v === 'number') { type = 'number'; break; }
      if (typeof v === 'boolean') { type = 'boolean'; break; }
      if (typeof v === 'string') {
        const num = Number(v.replace?.(/\s+/g, '') ?? v);
        if (!Number.isNaN(num) && v.trim() !== '') { type = 'number'; break; }
        const d = new Date(v);
        if (!Number.isNaN(d.getTime())) { type = 'date'; break; }
      }
      if (v instanceof Date) { type = 'date'; break; }
    }
    result.push({ field, type });
  }
  return result;
}

function listDatasets() {
  return datasetsStore.get('items', []);
}

function getDataset(id) {
  const filePath = path.join(getDatasetsDir(), `${id}.json`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

function createDataset(name, rows, sourceMeta = {}) {
  const id = generateId();
  const createdAt = new Date().toISOString();
  const schema = inferSchema(rows);
  const preview = rows.slice(0, 50);
  const filePath = path.join(getDatasetsDir(), `${id}.json`);
  fs.writeFileSync(filePath, JSON.stringify({ id, name, schema, rows }, null, 2), 'utf-8');
  const items = listDatasets();
  const item = { id, name, createdAt, rowsCount: rows.length, schema, source: sourceMeta };
  datasetsStore.set('items', [item, ...items]);
  return item;
}

function renameDataset(id, newName) {
  const items = listDatasets();
  const idx = items.findIndex(i => i.id === id);
  if (idx === -1) return false;
  items[idx].name = newName;
  datasetsStore.set('items', items);
  // also update file header name
  const filePath = path.join(getDatasetsDir(), `${id}.json`);
  if (fs.existsSync(filePath)) {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    content.name = newName;
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf-8');
  }
  return true;
}

function deleteDataset(id) {
  const items = listDatasets().filter(i => i.id !== id);
  datasetsStore.set('items', items);
  const filePath = path.join(getDatasetsDir(), `${id}.json`);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  return true;
}

module.exports = {
  listDatasets,
  getDataset,
  createDataset,
  renameDataset,
  deleteDataset,
};
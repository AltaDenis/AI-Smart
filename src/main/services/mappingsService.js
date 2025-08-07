const Store = require('electron-store');

const mappingsStore = new Store({ name: 'mappings' });

function getKey(datasetId, reportId) {
  return `${datasetId}::${reportId}`;
}

function getMapping(datasetId, reportId) {
  return mappingsStore.get(getKey(datasetId, reportId), {});
}

function setMapping(datasetId, reportId, mapping) {
  mappingsStore.set(getKey(datasetId, reportId), mapping || {});
  return true;
}

module.exports = { getMapping, setMapping };
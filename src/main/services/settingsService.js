const Store = require('electron-store');

const schema = {
  userName: { type: 'string', default: 'Пользователь' },
  userEmail: { type: 'string', default: '' },
  theme: { type: 'string', enum: ['dark', 'light'], default: 'dark' },
  accentColor: { type: 'string', default: '#2a7fff' },
};

const store = new Store({ name: 'settings', schema });

function getSetting(key) {
  return store.get(key, null);
}

function setSetting(key, value) {
  store.set(key, value);
  return true;
}

module.exports = { getSetting, setSetting };
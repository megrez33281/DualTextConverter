const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  translateText: (text, targetLang) =>
    ipcRenderer.invoke('translate-text', { text, targetLang }),
});
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  translateText: ({text, sourceType, targetType}) =>
    ipcRenderer.invoke('translate-text', { text, sourceType, targetType }),
});
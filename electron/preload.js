const { contextBridge, ipcRenderer } = require('electron');

// نحن نكشف فقط وظائف محددة للواجهة الأمامية لحماية النظام
contextBridge.exposeInMainWorld('electronAPI', {
  // مثال لوظائف مستقبلية
  print: () => ipcRenderer.send('print-document'),
  saveToDb: (data) => ipcRenderer.invoke('db-save', data),
  getFromDb: (query) => ipcRenderer.invoke('db-get', query)
});
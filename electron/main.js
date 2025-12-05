const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// منع التطبيق من التوقف عند إغلاق النوافذ (في ماك)
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    title: "Nile IVF Center EMR",
    webPreferences: {
      nodeIntegration: false, // للأمان
      contextIsolation: true, // للأمان
      preload: path.join(__dirname, 'preload.js')
    },
    // إخفاء شريط القوائم العلوي لمظهر أكثر احترافية
    autoHideMenuBar: true 
  });

  // في وضع التطوير، قم بتحميل السيرفر المحلي
  // في وضع الإنتاج (بعد التسطيب)، قم بتحميل ملف index.html
  const isDev = !app.isPackaged;
  
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // فتح أدوات المطور للمساعدة في التصحيح
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// هنا سنضيف لاحقاً (IPC Handlers) للتعامل مع قاعدة البيانات والطباعة
// مثال:
// ipcMain.handle('save-patient', async (event, data) => { ... })
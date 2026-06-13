const { app, BrowserWindow } = require('electron');
const path = require('path');
require('dotenv').config();

// Try to start the express server if running locally packaged
let server;
try {
  server = require('../dist/server.cjs');
} catch (e) {
  console.log("Could not load backend, running as client only or port might be taken.", e);
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    title: "CRYBRUH - Студия CRYTEAM",
    autoHideMenuBar: true,
  });

  // Load the backend or fall back to static
  // Assuming the node server runs on port 3000
  win.loadURL('http://localhost:3000').catch(() => {
    // Fallback if express fails
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  });
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

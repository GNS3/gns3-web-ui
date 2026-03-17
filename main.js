const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');

// IPC Handlers
const registerWiresharkHandler = require('./ipc-handlers/wireshark-handler');
const registerRdpHandler = require('./ipc-handlers/rdp-handler');
const registerCaptureHandler = require('./ipc-handlers/capture-handler');
const registerSystemHandlers = require('./ipc-handlers/system-handlers');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Development: Connect to Angular dev server
  // Production: Load packaged Angular files
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:4200');
    // Open DevTools in development
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
    // Temporarily enable DevTools for debugging
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Register all IPC handlers
function registerHandlers() {
  registerWiresharkHandler(ipcMain);
  registerRdpHandler(ipcMain);
  registerCaptureHandler(ipcMain);
  registerSystemHandlers(ipcMain);
}

// ============================================
// App Event Handlers
// ============================================

app.on('ready', () => {
  createWindow();
  registerHandlers();
});

app.on('window-all-closed', () => {
  // On macOS, keep app running even when all windows are closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS, recreate window when dock icon is clicked
  if (mainWindow === null) {
    createWindow();
  }
});

// Handle new windows - differentiate internal vs external links
let newWindowId = 0;
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();

    console.log(`[Debug] New window requested: ${navigationUrl}`);

    // Check if it's an internal link (Web UI related)
    const isInternalLink = navigationUrl.includes('/static/') ||
                          navigationUrl.includes('/console') ||
                          navigationUrl.includes('/web-ui') ||
                          navigationUrl.startsWith('http://localhost') ||
                          navigationUrl.startsWith('http://127.0.0.1');

    if (isInternalLink) {
      // Open internal links in Electron with DevTools for debugging
      const newWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          preload: path.join(__dirname, 'preload.js')
        }
      });

      newWindowId++;
      console.log(`[Debug] Opening internal window ${newWindowId}: ${navigationUrl}`);

      newWindow.loadURL(navigationUrl);
      newWindow.webContents.openDevTools();

      newWindow.on('closed', () => {
        console.log(`[Debug] Internal window ${newWindowId} closed`);
      });
    } else {
      // Open external links in system browser
      console.log(`[Debug] Opening external link in browser: ${navigationUrl}`);
      shell.openExternal(navigationUrl);
    }
  });
});

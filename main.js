const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const { exec } = require('child_process');

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
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ============================================
// IPC Handlers for Local Tool Integration
// ============================================

/**
 * Open Wireshark with a capture file
 */
ipcMain.handle('open-wireshark', async (event, captureFilePath) => {
  return new Promise((resolve, reject) => {
    let wiresharkPath;

    // Detect Wireshark path based on platform
    if (process.platform === 'win32') {
      wiresharkPath = 'C:\\Program Files\\Wireshark\\Wireshark.exe';
    } else if (process.platform === 'darwin') {
      wiresharkPath = '/Applications/Wireshark.app/Contents/MacOS/Wireshark';
    } else {
      wiresharkPath = '/usr/bin/wireshark';
    }

    exec(`"${wiresharkPath}" "${captureFilePath}"`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Failed to open Wireshark: ${error.message}`);
        reject({ success: false, error: error.message });
      } else {
        console.log('Wireshark launched successfully');
        resolve({ success: true });
      }
    });
  });
});

/**
 * Open RDP connection
 */
ipcMain.handle('open-rdp', async (event, config) => {
  return new Promise((resolve, reject) => {
    let command;

    if (process.platform === 'win32') {
      // Windows mstsc
      command = `mstsc /v:${config.host}:${config.port}`;
      if (config.username) {
        command += ` /u:${config.username}`;
      }
    } else if (process.platform === 'darwin') {
      // Mac Microsoft Remote Desktop
      command = `open "rdp://full%20address=s:${config.host}:${config.port}"`;
    } else {
      // Linux rdesktop
      command = `rdesktop ${config.host}:${config.port}`;
      if (config.username) {
        command += ` -u ${config.username}`;
      }
    }

    exec(command, (error) => {
      if (error) {
        console.error(`Failed to open RDP: ${error.message}`);
        reject({ success: false, error: error.message });
      } else {
        console.log('RDP launched successfully');
        resolve({ success: true });
      }
    });
  });
});

/**
 * Check if software is installed
 */
ipcMain.handle('check-software', async (event, softwareName) => {
  const { execSync } = require('child_process');

  try {
    if (softwareName === 'wireshark') {
      if (process.platform === 'win32') {
        execSync('where wireshark');
      } else {
        execSync('which wireshark');
      }
      return { installed: true };
    }
    return { installed: false };
  } catch (error) {
    return { installed: false };
  }
});

/**
 * Get platform information
 */
ipcMain.handle('get-platform-info', async () => {
  return {
    platform: process.platform,
    arch: process.arch,
    versions: {
      node: process.versions.node,
      chrome: process.versions.chrome,
      electron: process.versions.electron
    }
  };
});

// ============================================
// App Event Handlers
// ============================================

app.on('ready', createWindow);

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

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
});

const electron = require('electron');
const fs = require('fs');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const path = require('path');
const url = require('url');
const yargs = require('yargs');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let serverProc = null;
let isWin = /^win/.test(process.platform);
let isDev = false;

const argv = yargs
  .describe('m', 'Maximizes window on startup.')
  .boolean('m')
  .describe('e', 'Environment, `dev` for developer mode and when not specified then production mode.')
  .choices('e', ['dev', null])
  .describe('d', 'Enable developer tools.')
  .boolean('d')
  .argv;

if (argv.e == 'dev') {
  isDev = true;
}


const createServerProc = () => {
  const directory = path.join(__dirname, 'dist');

  if (!fs.existsSync(directory)) {
    return;
  }

  fs.readdir(path.join(__dirname, 'dist'), (err, files) => {
    var serverPath = null;

    files.forEach((filename) => {
      if(filename.startsWith('exe.')) {
        if (isWin) {
          serverPath = path.join(__dirname, 'dist', filename, 'gns3server.exe');
        }
        else {
          serverPath = path.join(__dirname, 'dist', filename, 'gns3server');
        }
      }
    });

    if (serverPath == null) {
      console.error('gns3server cannot be found');
    }

    if (serverPath != null) {
      serverProc = require('child_process').execFile(serverPath, []);

      if (serverProc != null) {
        console.log('gns3server started from path: ' + serverPath);
      }
    }
  });
}

const exitServerProc = () => {
  if(serverProc) {
    serverProc.kill();
    serverProc = null;
  }
}


function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false, 
      preload: path.join(__dirname, 'sentry.js')
    }
  });

  // and load the index.html of the app.

  if(isDev) {
    mainWindow.loadURL('http://localhost:4200/');
  }
  else {
    mainWindow.loadURL(url.format({
      pathname: path.join(__dirname, 'dist/index.html'),
      protocol: 'file:',
      slashes: true
    }));
    mainWindow.maximize();
  }

  if(argv.d) {
    // Open the DevTools.
    mainWindow.webContents.openDevTools();
  }

  if(argv.m) {
    mainWindow.maximize();
  }

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// app.on('ready', createServerProc);
// app.on('will-quit', exitServerProc);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
});

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.



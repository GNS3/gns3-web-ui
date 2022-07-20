const { spawn } = require('child_process');
const kill = require('tree-kill');
const path = require('path');
const fs = require('fs');
const ini = require('ini');
const { ipcMain } = require('electron')
const { app } = require('electron')

const isWin = /^win/.test(process.platform);

let runningControllers = {};

exports.getLocalControllerPath = async () => {
  let binary = isWin ? 'gns3server.exe': 'gns3server';
  return findBinary('exe.', binary);
}

exports.getUbridgePath = async () => {
  let binary = isWin ? 'ubridge.exe': 'ubridge';
  return findBinary('ubridge', binary);
}

exports.startLocalController = async (controller) => {
  return await run(controller, {
    logStdout: true
  });
}

exports.stopLocalServer = async (controller) => {
  return await stop(controller.name);
}

exports.getrunningControllers = () => {
  return Object.keys(runningControllers);
}

exports.stopAllLocalControllers = async () => {
  return await stopAll();
}

async function findBinary(binaryDirectory, filename) {
  const lookupDirectories = [
    __dirname, 
    path.dirname(app.getPath('exe'))
  ];

  for(var directory of lookupDirectories) {
    const serverPath = await findBinaryInDirectory(directory, binaryDirectory, filename);
    if(serverPath !== undefined) {
      return serverPath;
    }
  }
}

async function findBinaryInDirectory(baseDirectory, binaryDirectory, filename) {
  const distDirectory = path.join(baseDirectory, 'dist');

  if (!fs.existsSync(distDirectory)) {
    return;
  }

  const files = fs.readdirSync(distDirectory);
  
  let binaryPath = null;

  files.forEach((directory) => {
    if(directory.startsWith(binaryDirectory)) {
      binaryPath = path.join(baseDirectory, 'dist', directory, filename);
    }
  });

  if(binaryPath !== null && fs.existsSync(binaryPath)) {
    return binaryPath;
  }

  return;
}


function getControllerArguments(controller, overrides, configPath) {
  let controllerArguments = [];
  if(controller.host) {
    controllerArguments.push('--host');
    controllerArguments.push(controller.host);
  }
  if(controller.port) {
    controllerArguments.push('--port');
    controllerArguments.push(controller.port);
  }

  controllerArguments.push('--local');

  if(configPath) {
    controllerArguments.push('--config');
    controllerArguments.push(configPath);
  }

  return controllerArguments;
}

function getChannelForController(controller) {
  return `local-controller-run-${controller.name}`;
}

function notifyStatus(status) {
  ipcMain.emit('local-controller-status-events', status);
}

function filterOutput(line) {
  const index = line.search('CRITICAL');
  if(index > -1) {
    return {
      isCritical: true,
      errorMessage: line.substr(index)
    };
  }
  return {
    isCritical: false
  }
}

async function stopAll() {
  for(var controllerName in runningControllers) {
    let result, error = await stop(controllerName);
  }
  console.log(`Stopped all controllers`);
}

async function stop(controllerName) {
  let pid = undefined;

  const runningServer = runningControllers[controllerName];

  if(runningServer !== undefined && runningServer.process) {
    pid = runningServer.process.pid;
  }

  console.log(`Stopping '${controllerName}' with PID='${pid}'`);
  
  const stopped = new Promise((resolve, reject) => {
    if(pid === undefined) {
      resolve(`Controller '${controllerName} is already stopped`);
      delete runningControllers[controllerName];
      return;
    }

    kill(pid, (error) => {
      if(error) {
        console.error(`Error occured during stopping '${controllerName}' with PID='${pid}'`);
        reject(error);
      }
      else {
        delete runningControllers[controllerName];
        console.log(`Stopped '${controllerName}' with PID='${pid}'`);
        resolve(`Stopped '${controllerName}' with PID='${pid}'`);

        notifyStatus({
          controllerName: controllerName,
          status: 'stopped',
          message: `Controller '${controllerName}' stopped'`
        });
      }
    });
  });

  return stopped;
}

async function getIniFile(controller) {
  return path.join(app.getPath('userData'), `gns3_controller_${controller.id}.ini`);
}

async function configure(configPath, controller) {
  if(!fs.existsSync(configPath)) {
    fs.closeSync(fs.openSync(configPath, 'w'));
    console.log(`Configuration file '${configPath}' has been created.`);
  }

  var config = ini.parse(fs.readFileSync(configPath, 'utf-8'));

  if(controller.path) {
    config.path = controller.path;
  }
  if(controller.host) {
    config.host = controller.host;
  }
  if(controller.port) {
    config.port = controller.port;
  }
  if(controller.ubridge_path) {
    config.ubridge_path = controller.ubridge_path;
  }

  fs.writeFileSync(configPath, ini.stringify(config, { section: 'Controller' }));
}

async function setPATHEnv() {
  const vpcsLookup = [
    path.join(__dirname, 'dist', 'vpcs'),
    path.join(path.dirname(app.getPath('exe')), 'dist', 'vpcs')
  ];

  const dynamipsLookup = [
    path.join(__dirname, 'dist', 'dynamips'),
    path.join(path.dirname(app.getPath('exe')), 'dist', 'dynamips')
  ];

  // prevent adding duplicates
  let extra = [
    ...vpcsLookup,
    ...dynamipsLookup
  ].filter((dir) => {
    return process.env.PATH.indexOf(dir) < 0;
  });
  extra.push(process.env.PATH);
  process.env.PATH = extra.join(";");
}

async function run(controller, options) {
  if(!options) {
    options = {};
  }

  const logStdout = options.logStdout || false;
  const logSterr = options.logSterr || false;

  console.log(`Configuring`);

  const configPath = await getIniFile(controller);
  await configure(configPath, controller);

  console.log(`Setting up PATH`);
  await setPATHEnv();

  console.log(`Running '${controller.path}'`);

  let controllerProcess = spawn(controller.path, getControllerArguments(controller, {}, configPath));

  notifyStatus({
    controllerName: controller.name,
    status: 'started',
    message: `Controller '${controller.name}' started'`
  });
  
  runningControllers[controller.name] = {
    process: controllerProcess
  };

  controllerProcess.stdout.on('data', function(data) {
    const line = data.toString();
    const { isCritical, errorMessage } = filterOutput(line);
    if(isCritical) {
      notifyStatus({
        controllerName: controller.name,
        status: 'stderr',
        message: `Controller reported error: '${errorMessage}`
      });
    }

    if(logStdout) {
      console.log(data.toString());
    }
  });

  controllerProcess.stderr.on('data', function(data) {
    if(logSterr) {
      console.log(data.toString());
    }
  });

  controllerProcess.on('exit', (code, signal) => {
    notifyStatus({
      controllerName: controller.name,
      status: 'errored',
      message: `controller '${controller.name}' has exited with status='${code}'`
    });
  });

  controllerProcess.on('error', (err) => {
    notifyStatus({
      controllerName: controller.name,
      status: 'errored',
      message: `Controller errored: '${err}`
    });
  });

}

async function main() {
  await run({
    name: 'my-local',
    path: 'c:\\Program Files\\GNS3\\gns3server.EXE',
    port: 3080
  }, {
    logStdout: true
  });
}

if(ipcMain) {
  ipcMain.on('local-controller-run', async function (event, controller) {
    const responseChannel = getChannelForController();
    await run(controller);
    event.sender.send(responseChannel, {
      success: true
    });
  });
}

if (require.main === module) {
  process.on('SIGINT', function() {
    console.log("Caught interrupt signal");
    stopAll();
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.log(`UnhandledRejection occured '${reason}'`);
    process.exit(1);
  });

  main();
}
const { spawn } = require('child_process');
const kill = require('tree-kill');
const path = require('path');
const fs = require('fs');
const ini = require('ini');
const { ipcMain } = require('electron')
const { app } = require('electron')

const isWin = /^win/.test(process.platform);

let runningServers = {};

exports.getLocalServerPath = async () => {
  let binary = isWin ? 'gns3server.exe': 'gns3server';
  return findBinary('exe.', binary);
}

exports.getUbridgePath = async () => {
  let binary = isWin ? 'ubridge.exe': 'ubridge';
  return findBinary('ubridge', binary);
}

exports.startLocalServer = async (server) => {
  return await run(server, {
    logStdout: true
  });
}

exports.stopLocalServer = async (server) => {
  return await stop(server.name);
}

exports.getRunningServers = () => {
  return Object.keys(runningServers);
}

exports.stopAllLocalServers = async () => {
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


function getServerArguments(server, overrides, configPath) {
  let serverArguments = [];
  if(server.host) {
    serverArguments.push('--host');
    serverArguments.push(server.host);
  }
  if(server.port) {
    serverArguments.push('--port');
    serverArguments.push(server.port);
  }

  serverArguments.push('--local');

  if(configPath) {
    serverArguments.push('--config');
    serverArguments.push(configPath);
  }

  return serverArguments;
}

function getChannelForServer(server) {
  return `local-server-run-${server.name}`;
}

function notifyStatus(status) {
  ipcMain.emit('local-server-status-events', status);
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
  for(var serverName in runningServers) {
    let result, error = await stop(serverName);
  }
  console.log(`Stopped all servers`);
}

async function stop(serverName) {
  let pid = undefined;

  const runningServer = runningServers[serverName];

  if(runningServer !== undefined && runningServer.process) {
    pid = runningServer.process.pid;
  }

  console.log(`Stopping '${serverName}' with PID='${pid}'`);
  
  const stopped = new Promise((resolve, reject) => {
    if(pid === undefined) {
      resolve(`Server '${serverName} is already stopped`);
      delete runningServers[serverName];
      return;
    }

    kill(pid, (error) => {
      if(error) {
        console.error(`Error occured during stopping '${serverName}' with PID='${pid}'`);
        reject(error);
      }
      else {
        delete runningServers[serverName];
        console.log(`Stopped '${serverName}' with PID='${pid}'`);
        resolve(`Stopped '${serverName}' with PID='${pid}'`);

        notifyStatus({
          serverName: serverName,
          status: 'stopped',
          message: `Server '${serverName}' stopped'`
        });
      }
    });
  });

  return stopped;
}

async function getIniFile(server) {
  return path.join(app.getPath('userData'), `gns3_server_${server.id}.ini`);
}

async function configure(configPath, server) {
  if(!fs.existsSync(configPath)) {
    fs.closeSync(fs.openSync(configPath, 'w'));
    console.log(`Configuration file '${configPath}' has been created.`);
  }

  var config = ini.parse(fs.readFileSync(configPath, 'utf-8'));

  if(server.path) {
    config.path = server.path;
  }
  if(server.host) {
    config.host = server.host;
  }
  if(server.port) {
    config.port = server.port;
  }
  if(server.ubridge_path) {
    config.ubridge_path = server.ubridge_path;
  }

  fs.writeFileSync(configPath, ini.stringify(config, { section: 'Server' }));
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

async function run(server, options) {
  if(!options) {
    options = {};
  }

  const logStdout = options.logStdout || false;
  const logSterr = options.logSterr || false;

  console.log(`Configuring`);

  const configPath = await getIniFile(server);
  await configure(configPath, server);

  console.log(`Setting up PATH`);
  await setPATHEnv();

  console.log(`Running '${server.path}'`);

  let serverProcess = spawn(server.path, getServerArguments(server, {}, configPath));

  notifyStatus({
    serverName: server.name,
    status: 'started',
    message: `Server '${server.name}' started'`
  });
  
  runningServers[server.name] = {
    process: serverProcess
  };

  serverProcess.stdout.on('data', function(data) {
    const line = data.toString();
    const { isCritical, errorMessage } = filterOutput(line);
    if(isCritical) {
      notifyStatus({
        serverName: server.name,
        status: 'stderr',
        message: `Server reported error: '${errorMessage}`
      });
    }

    if(logStdout) {
      console.log(data.toString());
    }
  });

  serverProcess.stderr.on('data', function(data) {
    if(logSterr) {
      console.log(data.toString());
    }
  });

  serverProcess.on('exit', (code, signal) => {
    notifyStatus({
      serverName: server.name,
      status: 'errored',
      message: `Server '${server.name}' has exited with status='${code}'`
    });
  });

  serverProcess.on('error', (err) => {
    notifyStatus({
      serverName: server.name,
      status: 'errored',
      message: `Server errored: '${err}`
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
  ipcMain.on('local-server-run', async function (event, server) {
    const responseChannel = getChannelForServer();
    await run(server);
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
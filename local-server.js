const { spawn } = require('child_process');
const kill = require('tree-kill');
const path = require('path');
const fs = require('fs');
const { ipcMain } = require('electron')
const { app } = require('electron')

const isWin = /^win/.test(process.platform);

let runningServers = {};

exports.getLocalServerPath = async () => {
  const lookupDirectories = [
    __dirname, 
    path.dirname(app.getPath('exe'))
  ];

  for(var directory of lookupDirectories) {
    const serverPath = await findLocalServerPath(directory);
    if(serverPath !== undefined) {
      return serverPath;
    }
  }

  return;
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

async function findLocalServerPath(baseDirectory) {
  const distDirectory = path.join(baseDirectory, 'dist');

  if (!fs.existsSync(distDirectory)) {
    return;
  }

  const files = fs.readdirSync(distDirectory);
  
  let serverPath = null;

  files.forEach((directory) => {
    if(directory.startsWith('exe.')) {
      if (isWin) {
        serverPath = path.join(baseDirectory, 'dist', directory, 'gns3server.exe');
      }
      else {
        serverPath = path.join(baseDirectory, 'dist', directory, 'gns3server');
      }
    }
  });

  if(serverPath !== null && fs.existsSync(serverPath)) {
    return serverPath;
  }

  return;
}

function getServerArguments(server, overrides) {
  let serverArguments = [];
  if(server.host) {
    serverArguments.push('--host');
    serverArguments.push(server.host);
  }
  if(server.port) {
    serverArguments.push('--port');
    serverArguments.push(server.port);
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

async function run(server, options) {
  if(!options) {
    options = {};
  }

  const logStdout = options.logStdout || false;
  const logSterr = options.logSterr || false;

  console.log(`Running '${server.path}'`);

  let serverProcess = spawn(server.path, getServerArguments(server));

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

ipcMain.on('local-server-run', async function (event, server) {
  const responseChannel = getChannelForServer();
  await run(server);
  event.sender.send(responseChannel, {
    success: true
  });
});


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
const { spawn } = require('child_process');
const kill = require('tree-kill');
const path = require('path');
const fs = require('fs');
const { ipcMain } = require('electron')

const isWin = /^win/.test(process.platform);

let runningServers = {};


exports.getLocalServerPath = async () => {
  const distDirectory = path.join(__dirname, 'dist');
  if (!fs.existsSync(distDirectory)) {
    return;
  }

  const files = fs.readdirSync(distDirectory);
  
  let serverPath = null;

  files.forEach((directory) => {
    if(directory.startsWith('exe.')) {
      if (isWin) {
        serverPath = path.join(__dirname, 'dist', directory, 'gns3server.exe');
      }
      else {
        serverPath = path.join(__dirname, 'dist', directory, 'gns3server');
      }
    }
  });

  if(serverPath !== null && fs.existsSync(serverPath)) {
    return serverPath;
  }

  return;
}

exports.startLocalServer = async (server) => {
  return await run(server);
}

exports.stopLocalServer = async (server) => {
  return await stop(server);
}

function getServerArguments(server, overrides) {
    let serverArguments = [];
    return serverArguments;
}

function getChannelForServer(server) {
    return `local-server-run-${server.name}`;
}

async function stopAll() {
    for(var serverName in runningServers) {
        let result, error = await stop(serverName);
    }
    console.log(`Stopped all servers`);
}

async function stop(serverName) {
    const runningServer = runningServers[serverName];
    const pid = runningServer.process.pid;
    console.log(`Stopping '${serverName}' with PID='${pid}'`);

    const stopped = new Promise((resolve, reject) => {
        kill(pid, (error) => {
            if(error) {
                console.error(`Error occured during stopping '${serverName}' with PID='${pid}'`);
                reject(error);
            }
            else {
                console.log(`Stopped '${serverName}' with PID='${pid}'`);
                resolve(`Stopped '${serverName}' with PID='${pid}'`);
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

    console.log(`Running '${server.path}'`);
 
    let serverProcess = spawn(server.path, getServerArguments(server));

    runningServers[server.name] = {
        process: serverProcess
    };

    serverProcess.stdout.on('data', function(data) {
        if(logStdout) {
            console.log(data.toString());
        }
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
        console.log(`UnhandledRejection occured 'reason'`);
        process.exit(1);
    });

    main();
}
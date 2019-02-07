const { spawn } = require('child_process');
const kill = require('tree-kill');

let runningServers = {};

function getServerArguments(server, overrides) {
    let serverArguments = [];
    return serverArguments;
}

async function stopAll() {
    Object.keys(runningServers).forEach(async (serverName) => {
        await stop(serverName);
    });
}

async function stop(serverName) {
    const runningServer = runningServers[serverName];
    const pid = runningServer.process.pid;
    console.log(`Stopping '${serverName}' with PID='${pid}'`);
    kill(pid, (error) => {
        if(error) {
            console.error(`Error occured during stopping '${serverName}' with PID='${pid}'`);
        }
        else {
            console.log(`Stopped '${serverName}' with PID='${pid}'`);
        }
    });
}

async function run(server, options) {
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
const { spawn } = require('child_process');

servers = [
    {
        name: 'my-local',
        path: 'c:\\Program Files\\GNS3\\gns3server.EXE'
    }
]


async function run(server) {
    console.log(`Running '${server.path}'`);
    const process = spawn(server.path);

    process.on('exit', () => {
        console.log(`Process has exited`);
    });

    process.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
    });

    process.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });

    process.stderr.on('data', (data) => {
        console.log(`stderr: ${data}`);
    });

}

async function main() {
    await run(servers[0]);
}

if (require.main === module) {
    main();
}
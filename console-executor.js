const { spawn } = require('child_process');
const { app } = require('electron');
const path = require('path');

async function setPATHEnv() {
  const puttyLookup = [
    path.join(__dirname, 'dist', 'putty'),
    path.join(path.dirname(app.getPath('exe')), 'dist', 'putty')
  ];

  // prevent adding duplicates
  let extra = [
    ...puttyLookup,
  ].filter((dir) => {
    return process.env.PATH.indexOf(dir) < 0;
  });
  extra.push(process.env.PATH);
  process.env.PATH = extra.join(";");
}

exports.openConsole = async (consoleRequest) => {
  // const genericConsoleCommand = 'xfce4-terminal --tab -T "%d" -e "telnet %h %p"';
  const genericConsoleCommand = 'putty.exe -telnet %h %p -loghost "%d"';

  const command = prepareCommand(genericConsoleCommand, consoleRequest);
  
  console.log(`Setting up PATH`);
  await setPATHEnv();
  
  console.log(`Starting console with command: '${command}'`);

  let consoleProcess = spawn(command, [], {
    shell :true
  });

  consoleProcess.stdout.on('data', (data) => {
    console.log(`Console stdout is producing: ${data.toString()}`);
  });

  consoleProcess.stderr.on('data', (data) => {
    console.log(`Console stderr is producing: ${data.toString()}`);
  });

  consoleProcess.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
  });
}


function prepareCommand(consoleCommand, consoleRequest) {
  const mapping = {
    h: consoleRequest.host,
    p: consoleRequest.port,
    d: consoleRequest.name,
    i: consoleRequest.project_id,
    n: consoleRequest.node_id,
    c: consoleRequest.server_url
  };

  for(var key in mapping) {
    const regExp = new RegExp(`%${key}`, 'g');
    consoleCommand = consoleCommand.replace(regExp, mapping[key]);
  }
  return consoleCommand;
}
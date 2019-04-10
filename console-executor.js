const { spawn } = require('child_process');

exports.openConsole = async (consoleRequest) => {
  const genericConsoleCommand = 'xfce4-terminal --tab -T "%d" -e "telnet %h %p"';
  const command = prepareCommand(genericConsoleCommand, consoleRequest);
  console.log(`Starting console with command: '${command}'`);

  let consoleProcess = spawn(command, [], {
    shell :true
  });

  consoleProcess.stdout.on('data', (data) => {
    console.log(`Console is producing: ${data.toString()}`);
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
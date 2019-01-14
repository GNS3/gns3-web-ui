var commandExistsSync = require('command-exists').sync;
var app = require('electron').app;
var fs = require('fs');
var util = require('util');
var fetch = require('node-fetch')
var stream = require('stream');
var path = require('path');
const { spawn } = require('child_process');
const { ipcMain } = require('electron')

var pipeline = util.promisify(stream.pipeline);



exports.getInstalledSoftware = (softwareList) => {
  const installed = {};
  for(var software of softwareList) {
    var name = software.name;
    var commands = software.commands;
    
    installed[name] = [];

    for(var command of commands) {
      var exists = commandExistsSync(command);
      if(exists) {
        installed[name].push(command);
      }
    }
  }
  return installed;
}

ipcMain.on('installed-software-install', async function (event, software) {
  const softwarePath = path.join(app.getAppPath(), software.binary);

  if (software.type == 'web') {
    try {
      var response = await fetch(software.resource);
      if (response.status != 200) {
        throw new Error(`Cannot download file ${software.resource}, response status = ${response.status}`);
      }
      await pipeline(
        response.body,
        fs.createWriteStream(softwarePath)
      );
    } catch(error) {
      event.sender.send('installed-software-installed', {
        success: false,
        message: error.message
      });
    }
  }

  const command = `${softwarePath}`;  
  const child = spawn(command, software.installation_arguments);
  child.on('exit', () => {
    console.log("exited");
  });

  event.sender.send('installed-software-installed', { 
    success: true
  });
});

var commandExistsSync = require('command-exists').sync;
var app = require('electron').app;
var fs = require('fs');
var util = require('util');
var fetch = require('node-fetch')
var stream = require('stream');
var path = require('path');
const { spawn } = require('child_process');
const { ipcMain } = require('electron');

var pipeline = util.promisify(stream.pipeline);

exports.getInstalledSoftware = (softwareList) => {
  const installed = {};
  for(var software of softwareList) {
    var name = software.name;
    var locations = software.locations;
    
    installed[name] = [];

    for(var location of locations) {
      // var exists = commandExistsSync(command);
      var exists = fs.existsSync(location);
      if(exists) {
        installed[name].push(location);
      }
    }
  }
  return installed;
}

async function downloadFile(resource, softwarePath) {
  var response = await fetch(resource);
  if (response.status != 200) {
    throw new Error(`Cannot download file ${resource}, response status = ${response.status}`);
  }
  await pipeline(
    response.body,
    fs.createWriteStream(softwarePath)
  );
}

async function getSoftwareInstallationPath(software) {
  if (software.installer) {
    return path.join(app.getPath('temp'), software.binary);
  }
  else {
    const externalPath = path.join(app.getAppPath(), 'external');
    const exists = fs.existsSync(externalPath);
    if (!exists) {
      fs.mkdirSync(externalPath);
    }
    return path.join(externalPath, software.binary);
  }
}


ipcMain.on('installed-software-install', async function (event, software) {
  const softwarePath = await getSoftwareInstallationPath(software);

  const responseChannel = `installed-software-installed-${software.name}`;

  if (software.type == 'web') {
    const exists = fs.existsSync(softwarePath);
    if (exists) {
      console.log(`Skipping downloading file due to '${softwarePath}' path exists`);
    }
    else {
      console.log(`File '${softwarePath}' doesn't exist. Downloading file.`);
      try {
        await downloadFile(software.resource, softwarePath);
      } catch(error) {
        event.sender.send(responseChannel, {
          success: false,
          message: error.message
        });
      }
    }
  }
  
  let child; 

  if (software.sudo) {
    child = spawn('powershell.exe', ['Start-Process', '-FilePath', `"${softwarePath}"`]);
  }
  else {
    child = spawn(softwarePath, software.installation_arguments);
  }
  
  child.on('exit', () => {
    event.sender.send(responseChannel, { 
      success: true
    });
  });

  child.on('error', (err) => {
    event.sender.send(responseChannel, { 
      success: false,
      message: err.message
    });
  });

  child.stdin.end();
});

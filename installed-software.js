var commandExistsSync = require('command-exists').sync;
var app = require('electron').app;

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

exports.install = (software) => {
  var type = software.type;

  if (type == 'web') {

  }

  console.log(app.getAppPath());
}
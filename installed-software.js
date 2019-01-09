var commandExistsSync = require('command-exists').sync;

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


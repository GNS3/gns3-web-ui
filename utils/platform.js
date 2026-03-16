/**
 * Platform Utilities
 *
 * Provides platform detection and platform-specific path utilities
 */

const os = require('os');
const fs = require('fs');

/**
 * Get Wireshark executable path for current platform
 */
function getWiresharkPath() {
  if (process.platform === 'win32') {
    return 'C:\\Program Files\\Wireshark\\Wireshark.exe';
  } else if (process.platform === 'darwin') {
    return '/Applications/Wireshark.app/Contents/MacOS/Wireshark';
  } else {
    return '/usr/bin/wireshark';
  }
}

/**
 * Get RDP command for current platform
 */
function getRDPCommand(config) {
  if (process.platform === 'win32') {
    let command = `mstsc /v:${config.host}:${config.port}`;
    if (config.username) {
      command += ` /u:${config.username}`;
    }
    return command;
  } else if (process.platform === 'darwin') {
    return `open "rdp://full%20address=s:${config.host}:${config.port}"`;
  } else {
    let command = `rdesktop ${config.host}:${config.port}`;
    if (config.username) {
      command += ` -u ${config.username}`;
    }
    return command;
  }
}

/**
 * Get tail command and arguments for current platform
 */
function getTailCommand(filePath) {
  if (process.platform === 'win32') {
    // Windows: try to use tail.exe from GNS3 or Git, fallback to PowerShell
    const possibleTailPaths = [
      'C:\\Program Files\\GNS3\\tail.exe',
      'C:\\Program Files (x86)\\GNS3\\tail.exe',
      'C:\\Program Files\\Git\\usr\\bin\\tail.exe',
      'C:\\Program Files (x86)\\Git\\usr\\bin\\tail.exe'
    ];

    for (const path of possibleTailPaths) {
      if (fs.existsSync(path)) {
        return {
          command: path,
          args: ['-f', '-c', '+0b', filePath],
          type: 'tail'
        };
      }
    }

    // Fallback to PowerShell Get-Content
    console.warn('[Platform] WARNING: tail.exe not found, using PowerShell fallback.');
    console.warn('[Platform] PowerShell may not handle binary pcap files correctly.');
    console.warn('[Platform] Please install Git for Windows or GNS3 for better support.');

    return {
      command: 'powershell.exe',
      args: ['-NoProfile', '-Command', `Get-Content -Wait -Path "${filePath}"`],
      type: 'powershell'
    };
  } else if (process.platform === 'darwin') {
    return {
      command: 'tail',
      args: ['-f', '-c', '+0', filePath],
      type: 'tail'
    };
  } else {
    return {
      command: 'tail',
      args: ['-f', '-c', '+0b', filePath],
      type: 'tail'
    };
  }
}

/**
 * Get Wireshark command and arguments for streaming capture
 */
function getWiresharkStreamCommand() {
  if (process.platform === 'win32') {
    return {
      command: 'C:\\Program Files\\Wireshark\\Wireshark.exe',
      args: ['-k', '-i', '-']
    };
  } else if (process.platform === 'darwin') {
    return {
      command: '/Applications/Wireshark.app/Contents/MacOS/Wireshark',
      args: ['-k', '-i', '-']
    };
  } else {
    return {
      command: 'wireshark',
      args: ['-k', '-i', '-']
    };
  }
}

/**
 * Get temporary file path for capture
 */
function getTempCapturePath(linkId) {
  return `${os.tmpdir()}/gns3-capture-${linkId}.pcap`;
}

module.exports = {
  getWiresharkPath,
  getRDPCommand,
  getTailCommand,
  getWiresharkStreamCommand,
  getTempCapturePath
};

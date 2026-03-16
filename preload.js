const { contextBridge, ipcRenderer } = require('electron');

/**
 * Expose protected methods that allow the renderer process to use
 * the ipcRenderer without exposing the entire object
 */
contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * Open Wireshark with a capture file
   * @param {string} captureFilePath - Path to the capture file
   * @returns {Promise<{success: boolean}>}
   */
  openWireshark: (captureFilePath) =>
    ipcRenderer.invoke('open-wireshark', captureFilePath),

  /**
   * Open RDP connection
   * @param {Object} config - RDP configuration
   * @param {string} config.host - Remote host address
   * @param {number} config.port - RDP port
   * @param {string} [config.username] - Optional username
   * @returns {Promise<{success: boolean}>}
   */
  openRDP: (config) =>
    ipcRenderer.invoke('open-rdp', config),

  /**
   * Check if software is installed
   * @param {string} softwareName - Name of the software (e.g., 'wireshark')
   * @returns {Promise<{installed: boolean}>}
   */
  checkSoftware: (softwareName) =>
    ipcRenderer.invoke('check-software', softwareName),

  /**
   * Download capture file from GNS3 server and open in Wireshark
   * @param {Object} config - Capture configuration
   * @param {string} config.host - GNS3 server host
   * @param {number} config.port - GNS3 server port
   * @param {string} config.protocol - Protocol (http/https)
   * @param {string} config.projectId - Project ID
   * @param {string} config.linkId - Link ID
   * @param {string} [config.captureName] - Capture file name
   * @returns {Promise<{success: boolean, file?: string}>}
   */
  downloadAndOpenCapture: (config) =>
    ipcRenderer.invoke('download-and-open-capture', config),

  /**
   * Get platform information
   * @returns {Promise<{platform: string, arch: string, versions: Object}>}
   */
  getPlatformInfo: () =>
    ipcRenderer.invoke('get-platform-info'),

  /**
   * Platform information (synchronous)
   */
  platform: process.platform,
  arch: process.arch,

  /**
   * Version information (synchronous)
   */
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  }
});

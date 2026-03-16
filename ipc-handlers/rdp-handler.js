/**
 * RDP IPC Handler
 *
 * Handles IPC requests for opening RDP connections
 */

const platform = require('../utils/platform');
const processManager = require('../utils/process-manager');

/**
 * Register RDP-related IPC handlers
 *
 * @param {object} ipcMain - Electron ipcMain object
 */
function registerRdpHandler(ipcMain) {
  /**
   * Open RDP connection
   */
  ipcMain.handle('open-rdp', async (event, config) => {
    try {
      const command = platform.getRDPCommand(config);
      return await processManager.executeCommand(command);
    } catch (error) {
      throw new Error(`Failed to open RDP: ${error.message}`);
    }
  });
}

module.exports = registerRdpHandler;

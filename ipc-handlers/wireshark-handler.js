/**
 * Wireshark IPC Handler
 *
 * Handles IPC requests for opening Wireshark with capture files
 */

const platform = require('../utils/platform');
const processManager = require('../utils/process-manager');

/**
 * Register Wireshark-related IPC handlers
 *
 * @param {object} ipcMain - Electron ipcMain object
 */
function registerWiresharkHandler(ipcMain) {
  /**
   * Open Wireshark with a capture file
   */
  ipcMain.handle('open-wireshark', async (event, captureFilePath) => {
    try {
      const wiresharkPath = platform.getWiresharkPath();
      const command = `"${wiresharkPath}" "${captureFilePath}"`;
      return await processManager.executeCommand(command);
    } catch (error) {
      throw new Error(`Failed to open Wireshark: ${error.message}`);
    }
  });
}

module.exports = registerWiresharkHandler;

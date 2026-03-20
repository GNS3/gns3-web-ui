/**
 * System IPC Handlers
 *
 * Handles IPC requests for system information and software detection
 */

const processManager = require('../utils/process-manager');

/**
 * Register system-related IPC handlers
 *
 * @param {object} ipcMain - Electron ipcMain object
 */
function registerSystemHandlers(ipcMain) {
  /**
   * Check if software is installed
   */
  ipcMain.handle('check-software', async (event, softwareName) => {
    return processManager.checkSoftwareInstalled(softwareName);
  });

  /**
   * Get platform information
   */
  ipcMain.handle('get-platform-info', async () => {
    return {
      platform: process.platform,
      arch: process.arch,
      versions: {
        node: process.versions.node,
        chrome: process.versions.chrome,
        electron: process.versions.electron
      }
    };
  });
}

module.exports = registerSystemHandlers;

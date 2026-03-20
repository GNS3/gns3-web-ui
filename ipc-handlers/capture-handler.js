/**
 * Capture IPC Handler
 *
 * Handles IPC requests for packet capture streaming
 */

const CaptureService = require('../services/capture-service');

/**
 * Register capture-related IPC handlers
 *
 * @param {object} ipcMain - Electron ipcMain object
 */
function registerCaptureHandler(ipcMain) {
  const captureService = new CaptureService();

  /**
   * Download capture file from GNS3 server and open in Wireshark
   */
  ipcMain.handle('download-and-open-capture', async (event, config) => {
    try {
      return await captureService.downloadAndOpen(config);
    } catch (error) {
      console.error('[CaptureHandler] Error:', error);
      throw error;
    }
  });
}

module.exports = registerCaptureHandler;

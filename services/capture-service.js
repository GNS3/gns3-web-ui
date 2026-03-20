/**
 * Capture Service
 *
 * Business logic for managing packet captures
 */

const httpClient = require('../utils/http-client');
const processManager = require('../utils/process-manager');

class CaptureService {
  /**
   * Download capture file from GNS3 server and open in Wireshark
   *
   * @param {object} config - Capture configuration
   * @returns {Promise<{success: boolean}>}
   */
  async downloadAndOpen(config) {
    try {
      const { host, port, protocol, projectId, linkId, captureName, authToken } = config;

      console.log('[CaptureService] Preparing to open Wireshark for link:', linkId);

      // Get link info to check if capture is running
      const linkInfoUrl = `${protocol}://${host}:${port}/v3/projects/${projectId}/links/${linkId}`;
      console.log('[CaptureService] Fetching link info:', linkInfoUrl);

      const linkInfoResponse = await httpClient.get(linkInfoUrl, authToken);

      if (linkInfoResponse.statusCode !== 200) {
        throw new Error(`Failed to get link info: HTTP ${linkInfoResponse.statusCode}`);
      }

      const linkInfo = JSON.parse(linkInfoResponse.data);
      console.log('[CaptureService] Link capturing status:', linkInfo.capturing);

      // If capture is not running, start it first
      if (!linkInfo.capturing) {
        console.log('[CaptureService] Capture not running, starting capture...');
        await this.startCapture(host, port, protocol, projectId, linkId, captureName, authToken);
      }

      // Stream capture to Wireshark
      const streamUrl = `${protocol}://${host}:${port}/v3/projects/${projectId}/links/${linkId}/capture/stream`;
      console.log('[CaptureService] Streaming capture from:', streamUrl);

      return await processManager.streamCaptureToWireshark(streamUrl, authToken, linkId);
    } catch (error) {
      console.error('[CaptureService] Error:', error);
      throw error;
    }
  }

  /**
   * Start packet capture on a link
   *
   * @param {string} host - GNS3 server host
   * @param {number} port - GNS3 server port
   * @param {string} protocol - Protocol (http/https)
   * @param {string} projectId - Project ID
   * @param {string} linkId - Link ID
   * @param {string} captureName - Capture file name
   * @param {string} authToken - Authentication token
   * @returns {Promise<void>}
   */
  async startCapture(host, port, protocol, projectId, linkId, captureName, authToken) {
    const startCaptureUrl = `${protocol}://${host}:${port}/v3/projects/${projectId}/links/${linkId}/capture/start`;
    const captureData = {
      capture_file_name: captureName || 'capture',
      data_link_type: 'DLT_EN10MB'
    };

    const startCaptureResponse = await httpClient.post(startCaptureUrl, authToken, captureData);

    if (startCaptureResponse.statusCode !== 200 && startCaptureResponse.statusCode !== 201) {
      throw new Error(`Failed to start capture: HTTP ${startCaptureResponse.statusCode}`);
    }

    console.log('[CaptureService] Capture started successfully');

    // Wait a bit for capture to initialize
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  /**
   * Get link information
   *
   * @param {string} host - GNS3 server host
   * @param {number} port - GNS3 server port
   * @param {string} protocol - Protocol (http/https)
   * @param {string} projectId - Project ID
   * @param {string} linkId - Link ID
   * @param {string} authToken - Authentication token
   * @returns {Promise<object>}
   */
  async getLinkInfo(host, port, protocol, projectId, linkId, authToken) {
    const url = `${protocol}://${host}:${port}/v3/projects/${projectId}/links/${linkId}`;
    const response = await httpClient.get(url, authToken);
    return JSON.parse(response.data);
  }
}

module.exports = CaptureService;

/**
 * Electron API Type Definitions
 *
 * This file defines the TypeScript types for the ElectronAPI exposed
 * via contextBridge in preload.js
 */

/**
 * Electron API exposed to renderer process
 */
interface ElectronAPI {
  /**
   * Open Wireshark with a capture file
   * @param captureFilePath - Path to the capture file
   * @returns Promise with success status
   */
  openWireshark(captureFilePath: string): Promise<{ success: boolean }>;

  /**
   * Open RDP connection
   * @param config - RDP configuration
   * @returns Promise with success status
   */
  openRDP(config: {
    host: string;
    port: number;
    username?: string;
  }): Promise<{ success: boolean }>;

  /**
   * Check if software is installed
   * @param softwareName - Name of the software (e.g., 'wireshark')
   * @returns Promise with installation status
   */
  checkSoftware(softwareName: string): Promise<{ installed: boolean }>;

  /**
   * Download capture file from GNS3 server and open in Wireshark
   * @param config - Capture configuration
   * @returns Promise with success status and file path
   */
  downloadAndOpenCapture(config: {
    host: string;
    port: number;
    protocol: string;
    projectId: string;
    linkId: string;
    captureName?: string;
    authToken?: string;
  }): Promise<{ success: boolean; file?: string }>;

  /**
   * Get platform information
   * @returns Promise with platform details
   */
  getPlatformInfo(): Promise<{
    platform: 'win32' | 'darwin' | 'linux';
    arch: 'x64' | 'arm64';
    versions: {
      node: string;
      chrome: string;
      electron: string;
    };
  }>;

  /**
   * Platform (synchronous)
   */
  platform: 'win32' | 'darwin' | 'linux';

  /**
   * Architecture (synchronous)
   */
  arch: 'x64' | 'arm64';

  /**
   * Version information (synchronous)
   */
  versions: {
    node: string;
    chrome: string;
    electron: string;
  };
}

/**
 * Extend Window interface to include electronAPI
 */
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

// Export to make this a module
export {};

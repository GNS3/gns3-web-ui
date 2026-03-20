import { Injectable } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

/**
 * Electron Service
 *
 * Provides integration with Electron for local tool execution
 * (Wireshark, RDP, etc.)
 *
 * This service safely handles environments where Electron is not available
 * (e.g., standard web browsers)
 */
@Injectable({
  providedIn: 'root'
})
export class ElectronService {

  /**
   * Check if running in Electron environment
   */
  isElectron(): boolean {
    return !!(window && (window as any).electronAPI);
  }

  /**
   * Open Wireshark with a capture file
   *
   * @param captureFilePath - Absolute path to the capture file
   * @returns Observable with success status
   */
  openWireshark(captureFilePath: string): Observable<boolean> {
    if (!this.isElectron()) {
      console.warn('[ElectronService] Not running in Electron environment');
      return of(false);
    }

    return from(
      (window as any).electronAPI.openWireshark(captureFilePath)
    ).pipe(
      map((result: any) => {
        console.log('[ElectronService] Wireshark opened:', result);
        return result.success;
      }),
      catchError(error => {
        console.error('[ElectronService] Failed to open Wireshark:', error);
        return of(false);
      })
    );
  }

  /**
   * Open RDP connection to a remote host
   *
   * @param config - RDP connection configuration
   * @returns Observable with success status
   */
  openRDP(config: {
    host: string;
    port: number;
    username?: string;
  }): Observable<boolean> {
    if (!this.isElectron()) {
      console.warn('[ElectronService] Not running in Electron environment');
      return of(false);
    }

    return from(
      (window as any).electronAPI.openRDP(config)
    ).pipe(
      map((result: any) => {
        console.log('[ElectronService] RDP opened:', result);
        return result.success;
      }),
      catchError(error => {
        console.error('[ElectronService] Failed to open RDP:', error);
        return of(false);
      })
    );
  }

  /**
   * Check if software is installed on the local system
   *
   * @param softwareName - Name of the software (e.g., 'wireshark')
   * @returns Observable with installation status
   */
  checkSoftware(softwareName: string): Observable<boolean> {
    if (!this.isElectron()) {
      return of(false);
    }

    return from(
      (window as any).electronAPI.checkSoftware(softwareName)
    ).pipe(
      map((result: any) => result.installed),
      catchError(() => of(false))
    );
  }

  /**
   * Download capture file from GNS3 server and open in Wireshark
   *
   * @param config - Capture configuration
   * @returns Observable with success status
   */
  downloadAndOpenCapture(config: {
    host: string;
    port: number;
    protocol: string;
    projectId: string;
    linkId: string;
    captureName?: string;
    authToken?: string;
  }): Observable<{ success: boolean; file?: string }> {
    if (!this.isElectron()) {
      console.warn('[ElectronService] Not running in Electron environment');
      return of({ success: false });
    }

    return from(
      (window as any).electronAPI.downloadAndOpenCapture(config)
    ).pipe(
      map((result: any) => {
        console.log('[ElectronService] Capture downloaded and Wireshark opened:', result);
        return result;
      }),
      catchError(error => {
        console.error('[ElectronService] Failed to download/open capture:', error);
        return of({ success: false });
      })
    );
  }

  /**
   * Get platform information
   *
   * @returns Observable with platform details
   */
  getPlatformInfo(): Observable<{
    platform: 'win32' | 'darwin' | 'linux';
    arch: 'x64' | 'arm64';
    versions: {
      node: string;
      chrome: string;
      electron: string;
    };
  } | null> {
    if (!this.isElectron()) {
      return of(null);
    }

    return from(
      (window as any).electronAPI.getPlatformInfo()
    ).pipe(
      catchError(() => of(null))
    );
  }

  /**
   * Get current platform (synchronous)
   *
   * @returns Platform string or 'browser' if not in Electron
   */
  getPlatform(): string {
    if (this.isElectron()) {
      return (window as any).electronAPI.platform;
    }
    return 'browser';
  }

  /**
   * Get current architecture (synchronous)
   *
   * @returns Architecture string or null if not in Electron
   */
  getArch(): string | null {
    if (this.isElectron()) {
      return (window as any).electronAPI.arch;
    }
    return null;
  }

  /**
   * Get Electron version (synchronous)
   *
   * @returns Version string or null if not in Electron
   */
  getElectronVersion(): string | null {
    if (this.isElectron()) {
      return (window as any).electronAPI.versions.electron;
    }
    return null;
  }

  /**
   * Check if running on Windows
   */
  isWindows(): boolean {
    return this.getPlatform() === 'win32';
  }

  /**
   * Check if running on macOS
   */
  isMac(): boolean {
    return this.getPlatform() === 'darwin';
  }

  /**
   * Check if running on Linux
   */
  isLinux(): boolean {
    return this.getPlatform() === 'linux';
  }
}

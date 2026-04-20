import { Injectable, signal } from '@angular/core';

export interface MinimizedWindow {
  id: string;
  type: 'console' | 'wireshark';
  linkId?: string;
}

/**
 * Service to manage window minimize/restore state across components
 */
@Injectable({ providedIn: 'root' })
export class WindowManagementService {
  // Signal containing list of minimized windows
  private minimizedWindowsSignal = signal<MinimizedWindow[]>([]);

  // Readonly accessor
  readonly minimizedWindows = this.minimizedWindowsSignal.asReadonly();

  /**
   * Add a window to minimized list
   */
  minimizeWindow(id: string, type: 'console' | 'wireshark', linkId?: string): void {
    const current = this.minimizedWindowsSignal();
    if (!current.find(w => w.id === id)) {
      this.minimizedWindowsSignal.set([...current, { id, type, linkId }]);
    }
  }

  /**
   * Remove a window from minimized list (restore)
   */
  restoreWindow(id: string): void {
    const current = this.minimizedWindowsSignal();
    this.minimizedWindowsSignal.set(current.filter(w => w.id !== id));
  }

  /**
   * Check if a window is minimized
   */
  isMinimized(id: string): boolean {
    return !!this.minimizedWindowsSignal().find(w => w.id === id);
  }

  /**
   * Toggle window minimize state
   */
  toggleMinimize(id: string, type: 'console' | 'wireshark', linkId?: string): void {
    if (this.isMinimized(id)) {
      this.restoreWindow(id);
    } else {
      this.minimizeWindow(id, type, linkId);
    }
  }

  /**
   * Get minimized windows by type
   */
  getMinimizedByType(type: 'console' | 'wireshark'): MinimizedWindow[] {
    return this.minimizedWindowsSignal().filter(w => w.type === type);
  }

  /**
   * Clear all minimized windows
   */
  clearAll(): void {
    this.minimizedWindowsSignal.set([]);
  }
}

import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';

/**
 * Window style interface
 */
export interface WindowStyle {
  position?: string;
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
  width?: string;
  height?: string;
}

/**
 * Boundary check configuration interface
 */
export interface BoundaryConfig {
  minVisibleSize: number;  // Minimum visible size (pixels)
  minWidth: number;        // Minimum window width
  minHeight: number;       // Minimum window height
  maxWidth?: number;       // Maximum window width (optional)
  maxHeight?: number;      // Maximum window height (optional)
  topOffset?: number;      // Top offset (e.g., toolbar height) to keep window below (optional)
}

/**
 * Window boundary check service
 * Provides common window boundary check functionality for any draggable and resizable window component
 */
@Injectable({
  providedIn: 'root'
})
export class WindowBoundaryService {
  // Default boundary configuration
  private defaultConfig: BoundaryConfig = {
    minVisibleSize: 100,  // Keep at least 100px visible
    minWidth: 500,        // Minimum width 500px
    minHeight: 400        // Minimum height 400px
  };

  // Current boundary configuration
  private config$ = new BehaviorSubject<BoundaryConfig>(this.defaultConfig);

  constructor() {}

  /**
   * Get current boundary configuration
   * @returns Boundary configuration Observable
   */
  getConfig(): Observable<BoundaryConfig> {
    return this.config$.asObservable();
  }

  /**
   * Get current boundary configuration value
   * @returns Boundary configuration
   */
  getConfigValue(): BoundaryConfig {
    return this.config$.value;
  }

  /**
   * Set boundary configuration
   * @param config Boundary configuration
   */
  setConfig(config: Partial<BoundaryConfig>): void {
    const currentConfig = this.config$.value;
    this.config$.next({ ...currentConfig, ...config });
  }

  /**
   * Reset to default configuration
   */
  resetConfig(): void {
    this.config$.next(this.defaultConfig);
  }

  /**
   * Check and constrain drag position to ensure window does not exceed viewport boundaries
   * @param currentStyle Current window style
   * @param movementX X-axis movement distance
   * @param movementY Y-axis movement distance
   * @returns Constrained style object
   */
  constrainDragPosition(currentStyle: WindowStyle, movementX: number, movementY: number): WindowStyle {
    const config = this.config$.value;
    const width = Number(currentStyle.width?.split('px')[0]) || 0;
    const height = Number(currentStyle.height?.split('px')[0]) || 0;

    const result: WindowStyle = { ...currentStyle, position: 'fixed' };

    // Handle horizontal position (prefer right, then left)
    if (currentStyle.right !== undefined) {
      let right = Number(currentStyle.right.split('px')[0]) - movementX;

      // For right positioning:
      // - Larger right value moves window to the left
      // - Smaller (negative) right value moves window to the right
      // Right boundary: keep window within viewport (minRight is 0)
      const minRight = 0;
      // Left boundary: keep window within viewport (maxRight is viewportWidth - windowWidth)
      const maxRight = window.innerWidth - width;

      result.right = `${Math.max(minRight, Math.min(maxRight, right))}px`;
      delete result.left;
    } else if (currentStyle.left !== undefined) {
      let left = Number(currentStyle.left.split('px')[0]) + movementX;
      // Constrain left boundary - keep window within viewport
      const maxLeft = window.innerWidth - width;
      const minLeft = 0;
      result.left = `${Math.max(minLeft, Math.min(maxLeft, left))}px`;
      delete result.right;
    }

    // Handle vertical position (prefer top, then bottom)
    if (currentStyle.top !== undefined) {
      let top = Number(currentStyle.top.split('px')[0]) + movementY;
      // Constrain top boundary - keep window within viewport
      // Minimum top is topOffset (to keep below toolbar), or 0 if not set
      const minTop = config.topOffset || 0;
      const maxTop = window.innerHeight - height;
      result.top = `${Math.max(minTop, Math.min(maxTop, top))}px`;
      delete result.bottom;
    } else if (currentStyle.bottom !== undefined) {
      let bottom = Number(currentStyle.bottom.split('px')[0]) - movementY;
      // For bottom positioning:
      // - Larger bottom value moves window upward
      // - Smaller (negative) bottom value moves window downward
      // Bottom boundary: keep window within viewport (minBottom is 0)
      const minBottom = 0;
      // Top boundary: keep window within viewport, considering topOffset
      // Window top = window.innerHeight - bottom - height >= topOffset
      // So: bottom <= window.innerHeight - height - topOffset
      const maxBottom = window.innerHeight - height - (config.topOffset || 0);

      result.bottom = `${Math.max(minBottom, Math.min(maxBottom, bottom))}px`;
      delete result.top;
    }

    // Preserve width and height
    if (currentStyle.width) result.width = currentStyle.width;
    if (currentStyle.height) result.height = currentStyle.height;

    return result;
  }

  /**
   * Check and constrain resized window size to ensure it does not exceed viewport boundaries
   * @param width New width
   * @param height New height
   * @param left Left position (optional)
   * @param top Top position (optional)
   * @returns Constrained size and position
   */
  constrainResizeSize(
    width: number,
    height: number,
    left?: number,
    top?: number
  ): { width: number; height: number; left?: number; top?: number } {
    const config = this.config$.value;

    // Apply minimum size constraints
    let constrainedWidth = Math.max(config.minWidth, width);
    let constrainedHeight = Math.max(config.minHeight, height);

    // Apply maximum size constraints (if configured)
    if (config.maxWidth) {
      constrainedWidth = Math.min(config.maxWidth, constrainedWidth);
    }
    if (config.maxHeight) {
      constrainedHeight = Math.min(config.maxHeight, constrainedHeight);
    }

    // Ensure window does not exceed viewport
    const maxWidth = window.innerWidth - (left || 0);
    const maxHeight = window.innerHeight - (top || 0);

    constrainedWidth = Math.min(constrainedWidth, maxWidth);
    constrainedHeight = Math.min(constrainedHeight, maxHeight);

    return {
      width: constrainedWidth,
      height: constrainedHeight,
      left,
      top
    };
  }

  /**
   * Check and constrain window position to ensure window is completely within viewport (for restoring window position)
   * @param style Window style
   * @returns Constrained style
   */
  constrainWindowPosition(style: WindowStyle): WindowStyle {
    const config = this.config$.value;
    const width = Number(style.width?.split('px')[0]) || 0;
    const height = Number(style.height?.split('px')[0]) || 0;

    const result: WindowStyle = { ...style };

    // Handle horizontal position (using same logic as constrainDragPosition)
    if (style.right !== undefined) {
      let right = Number(style.right.split('px')[0]);
      // For right positioning:
      // - Larger right value moves window to the left
      // - Smaller (negative) right value moves window to the right
      // Right boundary: keep window within viewport (minRight is 0)
      const minRight = 0;
      // Left boundary: keep window within viewport (maxRight is viewportWidth - windowWidth)
      const maxRight = window.innerWidth - width;
      result.right = `${Math.max(minRight, Math.min(maxRight, right))}px`;
      delete result.left;
    } else if (style.left !== undefined) {
      let left = Number(style.left.split('px')[0]);
      // Constrain left boundary - keep window within viewport
      const maxLeft = window.innerWidth - width;
      const minLeft = 0;
      result.left = `${Math.max(minLeft, Math.min(maxLeft, left))}px`;
      delete result.right;
    }

    // Handle vertical position (using same logic as constrainDragPosition)
    if (style.top !== undefined) {
      let top = Number(style.top.split('px')[0]);
      // Constrain top boundary - keep window within viewport
      // Minimum top is topOffset (to keep below toolbar), or 0 if not set
      const minTop = config.topOffset || 0;
      const maxTop = window.innerHeight - height;
      result.top = `${Math.max(minTop, Math.min(maxTop, top))}px`;
      delete result.bottom;
    } else if (style.bottom !== undefined) {
      let bottom = Number(style.bottom.split('px')[0]);
      // For bottom positioning:
      // - Larger bottom value moves window upward
      // - Smaller (negative) bottom value moves window downward
      // Bottom boundary: keep window within viewport (minBottom is 0)
      const minBottom = 0;
      // Top boundary: keep window within viewport, considering topOffset
      // Window top = window.innerHeight - bottom - height >= topOffset
      // So: bottom <= window.innerHeight - height - topOffset
      const maxBottom = window.innerHeight - height - (config.topOffset || 0);
      result.bottom = `${Math.max(minBottom, Math.min(maxBottom, bottom))}px`;
      delete result.top;
    }

    return result;
  }

  /**
   * Check if given size is valid
   * @param width Width
   * @param height Height
   * @returns Whether valid
   */
  isValidSize(width: number, height: number): boolean {
    const config = this.config$.value;
    const validWidth = width >= config.minWidth;
    const validHeight = height >= config.minHeight;

    if (config.maxWidth && width > config.maxWidth) return false;
    if (config.maxHeight && height > config.maxHeight) return false;

    return validWidth && validHeight;
  }
}

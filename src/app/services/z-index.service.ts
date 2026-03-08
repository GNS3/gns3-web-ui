import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/**
 * Z-Index Layer Constants
 * Fixed z-index values for different UI layers
 * Windows use TEMP_TOP (1200) when clicked
 * Menus and dialogs use higher layers (1300+) to appear above windows
 */
export const Z_INDEX_LAYERS = {
  BASE: 1000,
  AI_CHAT: 1001,
  WEB_CONSOLE: 1002,
  TEMP_TOP: 1200,        // Active window (AI Chat or Web Console)
  SESSION_MENU: 1300,    // Session menu (needs to be above TEMP_TOP)
  CONFIRM_DIALOG: 1400,  // Confirmation dialog (needs to be above SESSION_MENU)
} as const;

/**
 * Z-Index layer type
 */
export type ZIndexLayer = keyof typeof Z_INDEX_LAYERS;

/**
 * Z-Index Management Service (Redesigned)
 * Uses fixed layers instead of incremental values
 * - Predictable: each component has a fixed z-index
 * - No overflow: values never grow infinitely
 * - Auto restore: when one element is brought to front, others are automatically restored
 */
@Injectable({
  providedIn: 'root'
})
export class ZIndexService {
  // Track original z-index before bringing to front
  private originalZIndexes = new Map<HTMLElement, number>();

  // Track elements currently at TEMP_TOP (1200)
  private elementsAtTop = new Set<HTMLElement>();

  // BehaviorSubject to notify components of z-index changes
  private zIndexChanged$ = new BehaviorSubject<number>(Z_INDEX_LAYERS.BASE);

  constructor() {}

  /**
   * Get fixed z-index for a specific layer
   * @param layer The layer key (e.g., 'AI_CHAT', 'WEB_CONSOLE')
   * @returns The fixed z-index value
   */
  getLayerZIndex(layer: ZIndexLayer): number {
    return Z_INDEX_LAYERS[layer];
  }

  /**
   * Get temporary top z-index for bringing element to front
   * @returns TEMP_TOP z-index (1200)
   */
  getTempTopZIndex(): number {
    return Z_INDEX_LAYERS.TEMP_TOP;
  }

  /**
   * Bring an element to front by setting it to TEMP_TOP (1200)
   * Automatically restores other elements that were at TEMP_TOP to their original layers
   * @param element The HTML element to bring to front
   */
  bringToFront(element: HTMLElement): void {
    if (!element) return;

    // Store original z-index if not already stored
    if (!this.originalZIndexes.has(element)) {
      const currentZIndex = parseInt(window.getComputedStyle(element).zIndex) || Z_INDEX_LAYERS.BASE;
      this.originalZIndexes.set(element, currentZIndex);
    }

    // Restore all other elements that are currently at TEMP_TOP
    this.elementsAtTop.forEach((topElement) => {
      if (topElement !== element && this.originalZIndexes.has(topElement)) {
        const originalZIndex = this.originalZIndexes.get(topElement)!;
        topElement.style.zIndex = String(originalZIndex);
        this.elementsAtTop.delete(topElement);
      }
    });

    // Set current element to TEMP_TOP
    element.style.zIndex = String(Z_INDEX_LAYERS.TEMP_TOP);
    this.elementsAtTop.add(element);
    this.zIndexChanged$.next(Z_INDEX_LAYERS.TEMP_TOP);
  }

  /**
   * Restore element's original z-index
   * @param element The HTML element to restore
   */
  restoreZIndex(element: HTMLElement): void {
    if (!element || !this.originalZIndexes.has(element)) return;

    const originalZIndex = this.originalZIndexes.get(element)!;
    element.style.zIndex = String(originalZIndex);
    this.originalZIndexes.delete(element);
    this.elementsAtTop.delete(element);
    this.zIndexChanged$.next(originalZIndex);
  }

  /**
   * Set z-index directly for a component (backward compatibility)
   * @param layer The layer to use
   * @param element The element to apply z-index to
   */
  applyLayerZIndex(layer: ZIndexLayer, element: HTMLElement): void {
    if (!element) return;
    element.style.zIndex = String(Z_INDEX_LAYERS[layer]);
  }

  /**
   * Observable for z-index changes
   */
  getZIndexChanged() {
    return this.zIndexChanged$.asObservable();
  }

  /**
   * Get the current active element at TEMP_TOP
   * @returns The element currently at TEMP_TOP, or undefined if none
   */
  getActiveElement(): HTMLElement | undefined {
    return Array.from(this.elementsAtTop)[0];
  }

  /**
   * Check if an element is currently at TEMP_TOP
   * @param element The element to check
   * @returns true if the element is at TEMP_TOP
   */
  isAtTop(element: HTMLElement): boolean {
    return this.elementsAtTop.has(element);
  }

  /**
   * Legacy method for backward compatibility
   * @deprecated Use getLayerZIndex() or bringToFront() instead
   */
  getNextZIndex(): number {
    console.warn('getNextZIndex() is deprecated. Use getLayerZIndex() or bringToFront() instead.');
    return Z_INDEX_LAYERS.TEMP_TOP;
  }

  /**
   * Legacy method for backward compatibility
   * @deprecated Use getLayerZIndex() instead
   */
  getCurrentZIndex(): number {
    console.warn('getCurrentZIndex() is deprecated. Use getLayerZIndex() instead.');
    return Z_INDEX_LAYERS.BASE;
  }

  /**
   * Reset all tracked elements (useful for testing)
   */
  reset(): void {
    // Restore all elements to their original z-index
    this.elementsAtTop.forEach((element) => {
      if (this.originalZIndexes.has(element)) {
        const originalZIndex = this.originalZIndexes.get(element)!;
        element.style.zIndex = String(originalZIndex);
      }
    });

    this.originalZIndexes.clear();
    this.elementsAtTop.clear();
    this.zIndexChanged$.next(Z_INDEX_LAYERS.BASE);
  }
}

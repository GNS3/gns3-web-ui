import { Injectable } from '@angular/core';

export type InterfaceDensity = 'normal' | 'compact';

/**
 * Manages the application interface density (`normal` vs `compact`).
 *
 * Persists the user's choice in `localStorage` and mirrors it onto the
 * document root as `data-density="normal|compact"` so component CSS can
 * react to it via `:host-context([data-density='compact'])` selectors.
 *
 * Density is **applied immediately** when `setDensity()` is called (e.g.
 * from the Settings page save handler) and **at construction time** from
 * the persisted value, so the saved preference is reflected on reload
 * before any component renders.
 */
@Injectable({ providedIn: 'root' })
export class InterfaceDensityService {
  private readonly storageKey = 'gns3_interface_density';

  /**
   * Custom-attribute name mirrors Angular Material's density convention
   * (`data-density` is the most common name; the project already uses
   * `data-*` attributes for theme state on `<html>`).
   */
  static readonly DENSITY_ATTR = 'data-density';

  constructor() {
    // Apply the persisted preference immediately at construction so the
    // attribute is correct before component render. `applyToDocument` is
    // a no-op when `document` is unavailable (SSR / private mode).
    this.applyToDocument(this.getDensity());
  }

  getDensity(): InterfaceDensity {
    const stored = this.readStorage();
    if (stored === 'normal' || stored === 'compact') {
      return stored;
    }
    return 'normal';
  }

  setDensity(density: InterfaceDensity): void {
    this.writeStorage(density);
    this.applyToDocument(density);
  }

  private readStorage(): string | null {
    try {
      return localStorage.getItem(this.storageKey);
    } catch {
      // localStorage may be unavailable (private mode / SSR); fall back.
      return null;
    }
  }

  private writeStorage(density: InterfaceDensity): void {
    try {
      localStorage.setItem(this.storageKey, density);
    } catch {
      // Ignore write errors — settings are best-effort.
    }
  }

  /**
   * Writes `data-density="normal|compact"` onto `<html>`.
   *
   * Wrapped in `try/catch` because the service may run outside the browser
   * (Angular Universal) where `document` is undefined. The attribute is the
   * *only* rendering effect of density — all visual changes live in
   * component CSS keyed on this attribute.
   */
  private applyToDocument(density: InterfaceDensity): void {
    try {
      const doc = (globalThis as { document?: Document }).document;
      if (doc?.documentElement) {
        doc.documentElement.setAttribute(InterfaceDensityService.DENSITY_ATTR, density);
      }
    } catch {
      // Non-browser environment; nothing to apply.
    }
  }
}
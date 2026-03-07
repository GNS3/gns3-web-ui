import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/**
 * Z-Index Management Service
 * Manages z-index layering for floating windows (AI Chat, Web Console, etc.)
 * Ensures that the most recently clicked window appears on top
 */
@Injectable({
  providedIn: 'root'
})
export class ZIndexService {
  // Starting z-index value for floating windows
  private readonly BASE_Z_INDEX = 1000;

  // Global z-index counter
  private globalZIndex = this.BASE_Z_INDEX;

  // BehaviorSubject to notify components of z-index changes
  private zIndexChanged$ = new BehaviorSubject<number>(this.BASE_Z_INDEX);

  constructor() {}

  /**
   * Get the next available z-index and increment the counter
   * @returns The next z-index value
   */
  getNextZIndex(): number {
    this.globalZIndex++;
    this.zIndexChanged$.next(this.globalZIndex);
    return this.globalZIndex;
  }

  /**
   * Get the current global z-index value without incrementing
   * @returns Current global z-index
   */
  getCurrentZIndex(): number {
    return this.globalZIndex;
  }

  /**
   * Reset z-index to base value (useful for testing or reset)
   */
  reset(): void {
    this.globalZIndex = this.BASE_Z_INDEX;
    this.zIndexChanged$.next(this.globalZIndex);
  }

  /**
   * Observable for z-index changes
   */
  getZIndexChanged() {
    return this.zIndexChanged$.asObservable();
  }
}

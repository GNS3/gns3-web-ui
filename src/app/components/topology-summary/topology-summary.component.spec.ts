import { describe, it, expect } from 'vitest';
import { TopologySummaryComponent } from './topology-summary.component';

describe('TopologySummaryComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (TopologySummaryComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have ngOnDestroy method', () => {
      expect(typeof (TopologySummaryComponent.prototype as any).ngOnDestroy).toBe('function');
    });

    it('should have revertPosition method', () => {
      expect(typeof (TopologySummaryComponent.prototype as any).revertPosition).toBe('function');
    });

    it('should have toggleDragging method', () => {
      expect(typeof (TopologySummaryComponent.prototype as any).toggleDragging).toBe('function');
    });

    it('should have dragWidget method', () => {
      expect(typeof (TopologySummaryComponent.prototype as any).dragWidget).toBe('function');
    });

    it('should have validate method', () => {
      expect(typeof (TopologySummaryComponent.prototype as any).validate).toBe('function');
    });

    it('should have onResizeEnd method', () => {
      expect(typeof (TopologySummaryComponent.prototype as any).onResizeEnd).toBe('function');
    });

    it('should have toggleTopologyVisibility method', () => {
      expect(typeof (TopologySummaryComponent.prototype as any).toggleTopologyVisibility).toBe('function');
    });

    it('should have compareAsc method', () => {
      expect(typeof (TopologySummaryComponent.prototype as any).compareAsc).toBe('function');
    });

    it('should have compareDesc method', () => {
      expect(typeof (TopologySummaryComponent.prototype as any).compareDesc).toBe('function');
    });

    it('should have setSortingOrder method', () => {
      expect(typeof (TopologySummaryComponent.prototype as any).setSortingOrder).toBe('function');
    });

    it('should have applyStatusFilter method', () => {
      expect(typeof (TopologySummaryComponent.prototype as any).applyStatusFilter).toBe('function');
    });

    it('should have applyCaptureFilter method', () => {
      expect(typeof (TopologySummaryComponent.prototype as any).applyCaptureFilter).toBe('function');
    });

    it('should have applyFilters method', () => {
      expect(typeof (TopologySummaryComponent.prototype as any).applyFilters).toBe('function');
    });

    it('should have checkCapturing method', () => {
      expect(typeof (TopologySummaryComponent.prototype as any).checkCapturing).toBe('function');
    });

    it('should have checkPacketFilters method', () => {
      expect(typeof (TopologySummaryComponent.prototype as any).checkPacketFilters).toBe('function');
    });

    it('should have close method', () => {
      expect(typeof (TopologySummaryComponent.prototype as any).close).toBe('function');
    });
  });
});

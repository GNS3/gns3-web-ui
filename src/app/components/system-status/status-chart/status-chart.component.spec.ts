import { describe, it, expect } from 'vitest';
import { StatusChartComponent } from './status-chart.component';

describe('StatusChartComponent', () => {
  describe('prototype methods', () => {
    it('should have formatBytes method', () => {
      expect(typeof (StatusChartComponent.prototype as any).formatBytes).toBe('function');
    });

    it('should have getNodeTypeEntries method', () => {
      expect(typeof (StatusChartComponent.prototype as any).getNodeTypeEntries).toBe('function');
    });

    it('should have getNodeStatusEntries method', () => {
      expect(typeof (StatusChartComponent.prototype as any).getNodeStatusEntries).toBe('function');
    });
  });
});

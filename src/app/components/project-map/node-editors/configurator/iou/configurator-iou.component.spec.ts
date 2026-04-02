import { describe, it, expect } from 'vitest';
import { ConfiguratorDialogIouComponent } from './configurator-iou.component';

describe('ConfiguratorDialogIouComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (ConfiguratorDialogIouComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have getConfiguration method', () => {
      expect(typeof (ConfiguratorDialogIouComponent.prototype as any).getConfiguration).toBe('function');
    });

    it('should have onSaveClick method', () => {
      expect(typeof (ConfiguratorDialogIouComponent.prototype as any).onSaveClick).toBe('function');
    });

    it('should have onCancelClick method', () => {
      expect(typeof (ConfiguratorDialogIouComponent.prototype as any).onCancelClick).toBe('function');
    });

    it('should have addTag method', () => {
      expect(typeof (ConfiguratorDialogIouComponent.prototype as any).addTag).toBe('function');
    });

    it('should have removeTag method', () => {
      expect(typeof (ConfiguratorDialogIouComponent.prototype as any).removeTag).toBe('function');
    });
  });
});

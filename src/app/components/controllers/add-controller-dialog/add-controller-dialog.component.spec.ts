import { describe, it, expect } from 'vitest';
import { AddControllerDialogComponent } from './add-controller-dialog.component';

describe('AddControllerDialogComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (AddControllerDialogComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have getLocations method', () => {
      expect(typeof (AddControllerDialogComponent.prototype as any).getLocations).toBe('function');
    });

    it('should have getDefaultLocation method', () => {
      expect(typeof (AddControllerDialogComponent.prototype as any).getDefaultLocation).toBe('function');
    });

    it('should have numberOfLocalControllers method', () => {
      expect(typeof (AddControllerDialogComponent.prototype as any).numberOfLocalControllers).toBe('function');
    });

    it('should have getDefaultHost method', () => {
      expect(typeof (AddControllerDialogComponent.prototype as any).getDefaultHost).toBe('function');
    });

    it('should have getDefaultPort method', () => {
      expect(typeof (AddControllerDialogComponent.prototype as any).getDefaultPort).toBe('function');
    });

    it('should have onAddClick method', () => {
      expect(typeof (AddControllerDialogComponent.prototype as any).onAddClick).toBe('function');
    });

    it('should have onAddAnywayClick method', () => {
      expect(typeof (AddControllerDialogComponent.prototype as any).onAddAnywayClick).toBe('function');
    });

    it('should have onNoClick method', () => {
      expect(typeof (AddControllerDialogComponent.prototype as any).onNoClick).toBe('function');
    });
  });
});

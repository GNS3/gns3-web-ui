import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ToasterService } from './toaster.service';
import { MatSnackBar } from '@angular/material/snack-bar';

describe('ToasterService', () => {
  let service: ToasterService;
  let mockMatSnackBar: any;
  let consoleErrorSpy: any;

  const configs = {
    success: { name: 'snackBarConfigForSuccess', duration: 4000, panelClass: 'snackabar-success' },
    warning: { name: 'snackBarConfigForWarning', duration: 4000, panelClass: 'snackabar-warning' },
    error: { name: 'snackBarConfigForError', duration: 10000, panelClass: 'snackabar-error' },
  };

  beforeEach(() => {
    mockMatSnackBar = { open: vi.fn() };
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    service = new ToasterService(mockMatSnackBar);
    vi.clearAllMocks();
  });

  describe('service creation', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it.each([
      ['success', configs.success],
      ['warning', configs.warning],
      ['error', configs.error],
    ])('should have %s config defined with correct properties', (_, config) => {
      const serviceConfig = service[config.name];
      expect(serviceConfig).toBeDefined();
      expect(serviceConfig.duration).toBe(config.duration);
      expect(serviceConfig.panelClass).toContain(config.panelClass);
      expect(serviceConfig.MatSnackBarHorizontalPosition).toBe('center');
      expect(serviceConfig.MatSnackBarVerticalPosition).toBe('bottom');
    });
  });

  describe('success', () => {
    it('should call snackbar.open with message and Close button', () => {
      service.success('Operation successful');
      expect(mockMatSnackBar.open).toHaveBeenCalledWith('Operation successful', 'Close', service.snackBarConfigForSuccess);
    });

    it('should handle empty message', () => {
      service.success('');
      expect(mockMatSnackBar.open).toHaveBeenCalledWith('', 'Close', service.snackBarConfigForSuccess);
    });

    it('should handle long messages', () => {
      const longMessage = 'A'.repeat(1000);
      service.success(longMessage);
      expect(mockMatSnackBar.open).toHaveBeenCalledWith(longMessage, 'Close', service.snackBarConfigForSuccess);
    });
  });

  describe('warning', () => {
    it('should call snackbar.open with message and Close button', () => {
      service.warning('This is a warning');
      expect(mockMatSnackBar.open).toHaveBeenCalledWith('This is a warning', 'Close', service.snackBarConfigForWarning);
    });

    it('should handle empty message', () => {
      service.warning('');
      expect(mockMatSnackBar.open).toHaveBeenCalledWith('', 'Close', service.snackBarConfigForWarning);
    });

    it('should handle special characters', () => {
      service.warning('Warning: <>&"\'');
      expect(mockMatSnackBar.open).toHaveBeenCalledWith('Warning: <>&"\'', 'Close', service.snackBarConfigForWarning);
    });
  });

  describe('error', () => {
    it('should call snackbar.open with message and Close button', () => {
      service.error('An error occurred');
      expect(mockMatSnackBar.open).toHaveBeenCalledWith('An error occurred', 'Close', service.snackBarConfigForError);
    });

    it('should log error to console', () => {
      service.error('Error message');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error message');
    });

    it('should handle empty error message', () => {
      service.error('');
      expect(mockMatSnackBar.open).toHaveBeenCalledWith('', 'Close', service.snackBarConfigForError);
      expect(consoleErrorSpy).toHaveBeenCalledWith('');
    });

    it('should handle error objects as strings', () => {
      const errorString = 'Error: Network timeout';
      service.error(errorString);
      expect(mockMatSnackBar.open).toHaveBeenCalledWith(errorString, 'Close', service.snackBarConfigForError);
      expect(consoleErrorSpy).toHaveBeenCalledWith(errorString);
    });
  });

  describe('config durations', () => {
    it.each([
      ['success', 4000],
      ['warning', 4000],
      ['error', 10000],
    ])('should have %dms duration for %s messages', (_, duration) => {
      const configName = _ === 'success' ? 'snackBarConfigForSuccess' : _ === 'warning' ? 'snackBarConfigForWarning' : 'snackBarConfigForError';
      expect(service[configName].duration).toBe(duration);
    });
  });

  describe('multiple toasts', () => {
    it('should handle multiple toasts in sequence', () => {
      service.success('First message');
      service.warning('Second message');
      service.error('Third message');

      expect(mockMatSnackBar.open).toHaveBeenCalledTimes(3);
      expect(mockMatSnackBar.open).toHaveBeenNthCalledWith(1, 'First message', 'Close', service.snackBarConfigForSuccess);
      expect(mockMatSnackBar.open).toHaveBeenNthCalledWith(2, 'Second message', 'Close', service.snackBarConfigForWarning);
      expect(mockMatSnackBar.open).toHaveBeenNthCalledWith(3, 'Third message', 'Close', service.snackBarConfigForError);
    });

    it('should handle multiple error logs', () => {
      service.error('Error 1');
      service.error('Error 2');
      service.error('Error 3');

      expect(consoleErrorSpy).toHaveBeenCalledTimes(3);
      expect(consoleErrorSpy).toHaveBeenNthCalledWith(1, 'Error 1');
      expect(consoleErrorSpy).toHaveBeenNthCalledWith(2, 'Error 2');
      expect(consoleErrorSpy).toHaveBeenNthCalledWith(3, 'Error 3');
    });
  });

  describe('edge cases', () => {
    it('should handle very long error messages', () => {
      const longError = 'E'.repeat(5000);
      service.error(longError);
      expect(mockMatSnackBar.open).toHaveBeenCalledWith(longError, 'Close', service.snackBarConfigForError);
      expect(consoleErrorSpy).toHaveBeenCalledWith(longError);
    });

    it('should handle unicode characters in messages', () => {
      service.success('Success ✓');
      service.warning('⚠️ Warning');
      service.error('❌ Error');
      expect(mockMatSnackBar.open).toHaveBeenCalledTimes(3);
    });

    it('should handle multiline messages', () => {
      const multiline = 'Line 1\nLine 2\nLine 3';
      service.error(multiline);
      expect(mockMatSnackBar.open).toHaveBeenCalledWith(multiline, 'Close', service.snackBarConfigForError);
      expect(consoleErrorSpy).toHaveBeenCalledWith(multiline);
    });
  });
});

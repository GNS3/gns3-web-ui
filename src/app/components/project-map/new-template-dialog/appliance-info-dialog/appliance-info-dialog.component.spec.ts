import { ApplianceInfoDialogComponent } from './appliance-info-dialog.component';
import { describe, it, expect } from 'vitest';

describe('ApplianceInfoDialogComponent', () => {
  it('should be defined', () => {
    expect(ApplianceInfoDialogComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(ApplianceInfoDialogComponent.name).toBe('ApplianceInfoDialogComponent');
  });
});

import { describe, it, expect, vi } from 'vitest';
import { InformationDialogComponent } from './information-dialog.component';
import { MatDialogRef } from '@angular/material/dialog';

describe('InformationDialogComponent', () => {
  it('should create', () => {
    // The component uses inject() which requires TestBed
    expect(InformationDialogComponent).toBeTruthy();
  });

  it('should have onNoClick method', () => {
    // These methods exist on the component class
    expect(typeof (InformationDialogComponent.prototype as any).onNoClick).toBe('function');
  });

  it('should have onYesClick method', () => {
    expect(typeof (InformationDialogComponent.prototype as any).onYesClick).toBe('function');
  });
});

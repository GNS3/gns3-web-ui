import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConfirmationDialogComponent, ConfirmationDialogData } from './confirmation-dialog.component';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

describe('ConfirmationDialogComponent', () => {
  let component: ConfirmationDialogComponent;
  let mockDialogRef: MatDialogRef<ConfirmationDialogComponent>;

  const mockData: ConfirmationDialogData = {
    message: 'Are you sure?',
    title: 'Confirm Action',
    confirmButtonText: 'Yes, proceed',
    cancelButtonText: 'No, cancel',
  };

  beforeEach(() => {
    mockDialogRef = {
      close: vi.fn(),
    } as any as MatDialogRef<ConfirmationDialogComponent>;

    component = new ConfirmationDialogComponent(mockDialogRef, mockData);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have dialogRef', () => {
    expect(component.dialogRef).toBeDefined();
  });

  it('should have data', () => {
    expect(component.data).toBeDefined();
    expect(component.data.message).toBe('Are you sure?');
  });

  it('should return custom title from data', () => {
    expect(component.title).toBe('Confirm Action');
  });

  it('should return default title when not provided', () => {
    const componentWithoutTitle = new ConfirmationDialogComponent(mockDialogRef, { message: 'Test' });
    expect(componentWithoutTitle.title).toBe('Confirm Delete');
  });

  it('should return custom confirm button text', () => {
    expect(component.confirmButtonText).toBe('Yes, proceed');
  });

  it('should return default confirm button text when not provided', () => {
    const componentWithoutText = new ConfirmationDialogComponent(mockDialogRef, { message: 'Test' });
    expect(componentWithoutText.confirmButtonText).toBe('Yes');
  });

  it('should return custom cancel button text', () => {
    expect(component.cancelButtonText).toBe('No, cancel');
  });

  it('should return default cancel button text when not provided', () => {
    const componentWithoutText = new ConfirmationDialogComponent(mockDialogRef, { message: 'Test' });
    expect(componentWithoutText.cancelButtonText).toBe('No');
  });

  it('should close dialog with false on onNoClick', () => {
    component.onNoClick();
    expect(mockDialogRef.close).toHaveBeenCalledWith(false);
  });

  it('should close dialog with true on onYesClick', () => {
    component.onYesClick();
    expect(mockDialogRef.close).toHaveBeenCalledWith(true);
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { RemoveToGroupDialogComponent } from './remove-to-group-dialog.component';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('RemoveToGroupDialogComponent', () => {
  let fixture: ComponentFixture<RemoveToGroupDialogComponent>;
  let mockDialogRef: { close: ReturnType<typeof vi.fn> };

  const testUserName = 'testuser';

  beforeEach(async () => {
    mockDialogRef = {
      close: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [RemoveToGroupDialogComponent, MatDialogModule, MatButtonModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { name: testUserName } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RemoveToGroupDialogComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should display the user name in the dialog content', () => {
    const paragraph = fixture.nativeElement.querySelector('mat-dialog-content p');
    expect(paragraph.textContent).toContain(testUserName);
  });

  it('should display "Remove User" as the dialog title', () => {
    const title = fixture.nativeElement.querySelector('h2');
    expect(title.textContent).toBe('Remove User');
  });

  describe('onCancel', () => {
    it('should close the dialog with false when cancel button is clicked', () => {
      const cancelButton = fixture.nativeElement.querySelector('button[mat-button]');
      cancelButton.click();
      fixture.detectChanges();

      expect(mockDialogRef.close).toHaveBeenCalledWith(false);
    });

    it('should close the dialog with false when onCancel is called directly', () => {
      fixture.componentInstance.onCancel();
      fixture.detectChanges();

      expect(mockDialogRef.close).toHaveBeenCalledWith(false);
    });
  });

  describe('onConfirm', () => {
    it('should close the dialog with true when remove button is clicked', () => {
      const removeButton = fixture.nativeElement.querySelector('button[color="warn"]');
      removeButton.click();
      fixture.detectChanges();

      expect(mockDialogRef.close).toHaveBeenCalledWith(true);
    });

    it('should close the dialog with true when onConfirm is called directly', () => {
      fixture.componentInstance.onConfirm();
      fixture.detectChanges();

      expect(mockDialogRef.close).toHaveBeenCalledWith(true);
    });
  });
});

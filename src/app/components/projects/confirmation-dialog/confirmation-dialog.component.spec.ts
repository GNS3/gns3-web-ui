import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from './confirmation-dialog.component';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('ConfirmationDialogComponent', () => {
  let fixture: ComponentFixture<ConfirmationDialogComponent>;
  let mockDialogRef: { close: ReturnType<typeof vi.fn> };

  const createMockProject = (status: string) =>
    ({ name: 'Test Project', status } as any);

  beforeEach(async () => {
    mockDialogRef = { close: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [ConfirmationDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { existingProject: createMockProject('closed') } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmationDialogComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('ngOnInit', () => {
    it('should set open message when project status is opened', async () => {
      mockDialogRef.close = vi.fn();

      TestBed.resetTestingModule();

      await TestBed.configureTestingModule({
        imports: [ConfirmationDialogComponent],
        providers: [
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: { existingProject: createMockProject('opened') } },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(ConfirmationDialogComponent);
      fixture.detectChanges();

      expect(fixture.componentInstance.confirmationMessage()).toBe(
        'Project Test Project is open. You can not overwrite it.',
      );
      expect(fixture.componentInstance.isOpen()).toBe(true);
    });

    it('should set overwrite message when project status is not opened', () => {
      expect(fixture.componentInstance.confirmationMessage()).toBe(
        'Project Test Project already exist, overwrite it?',
      );
      expect(fixture.componentInstance.isOpen()).toBe(false);
    });
  });

  describe('onNoClick', () => {
    it('should close dialog with false', () => {
      fixture.componentInstance.onNoClick();
      expect(mockDialogRef.close).toHaveBeenCalledWith(false);
    });
  });

  describe('onYesClick', () => {
    it('should close dialog with true', () => {
      fixture.componentInstance.onYesClick();
      expect(mockDialogRef.close).toHaveBeenCalledWith(true);
    });
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ProjectMapLockConfirmationDialogComponent } from './project-map-lock-confirmation-dialog.component';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('ProjectMapLockConfirmationDialogComponent', () => {
  let fixture: ComponentFixture<ProjectMapLockConfirmationDialogComponent>;
  let mockDialogRef: { close: ReturnType<typeof vi.fn> };

  const createComponent = (data: { actionType: string }) => {
    mockDialogRef = { close: vi.fn() };
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [ProjectMapLockConfirmationDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
    });
    fixture = TestBed.createComponent(ProjectMapLockConfirmationDialogComponent);
    fixture.detectChanges();
  };

  afterEach(() => fixture?.destroy());

  describe('when opened with Lock action', () => {
    beforeEach(() => createComponent({ actionType: 'Lock' }));

    it('should display "Lock All" in title', () => {
      const title = fixture.nativeElement.querySelector('h2');
      expect(title.textContent).toContain('Lock All');
    });

    it('should display lock message in content', () => {
      const content = fixture.nativeElement.querySelector('p');
      expect(content.textContent).toContain('Lock all devices');
    });
  });

  describe('when opened with Unlock action', () => {
    beforeEach(() => createComponent({ actionType: 'Unlock' }));

    it('should display "Unlock All" in title', () => {
      const title = fixture.nativeElement.querySelector('h2');
      expect(title.textContent).toContain('Unlock All');
    });

    it('should display unlock message in content', () => {
      const content = fixture.nativeElement.querySelector('p');
      expect(content.textContent).toContain('Unlock all devices');
    });
  });

  describe('confirmAction', () => {
    it('should close dialog with isAction true when actionType is Lock', () => {
      createComponent({ actionType: 'Lock' });
      fixture.componentInstance.confirmAction();
      expect(mockDialogRef.close).toHaveBeenCalledWith({
        actionType: 'Lock',
        isAction: true,
      });
    });

    it('should close dialog with isAction false when actionType is Unlock', () => {
      createComponent({ actionType: 'Unlock' });
      fixture.componentInstance.confirmAction();
      expect(mockDialogRef.close).toHaveBeenCalledWith({
        actionType: 'Unlock',
        isAction: false,
      });
    });
  });
});

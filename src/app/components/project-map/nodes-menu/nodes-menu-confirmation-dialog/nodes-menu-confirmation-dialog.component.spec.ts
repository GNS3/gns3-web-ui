import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NodesMenuConfirmationDialogComponent } from './nodes-menu-confirmation-dialog.component';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('NodesMenuConfirmationDialogComponent', () => {
  let fixture: ComponentFixture<NodesMenuConfirmationDialogComponent>;
  let mockDialogRef: { close: ReturnType<typeof vi.fn> };

  const createComponent = (actionType: string) => {
    mockDialogRef = { close: vi.fn() };
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [NodesMenuConfirmationDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: actionType },
      ],
    });
    fixture = TestBed.createComponent(NodesMenuConfirmationDialogComponent);
    fixture.detectChanges();
  };

  afterEach(() => fixture?.destroy());

  describe('when opened with Start action', () => {
    beforeEach(() => createComponent('start'));

    it('should display "Confirm start All" in title', () => {
      const title = fixture.nativeElement.querySelector('h2');
      expect(title.textContent).toContain('Confirm start All');
    });

    it('should display start message in content', () => {
      const content = fixture.nativeElement.querySelector('mat-dialog-content');
      expect(content.textContent).toContain('start all devices');
    });
  });

  describe('when opened with Stop action', () => {
    beforeEach(() => createComponent('stop'));

    it('should display "Confirm stop All" in title', () => {
      const title = fixture.nativeElement.querySelector('h2');
      expect(title.textContent).toContain('Confirm stop All');
    });

    it('should display stop message in content', () => {
      const content = fixture.nativeElement.querySelector('mat-dialog-content');
      expect(content.textContent).toContain('stop all devices');
    });
  });

  describe('confirmAction', () => {
    it('should close dialog with isAction true when confirmed', () => {
      createComponent('start');
      fixture.componentInstance.confirmAction();
      expect(mockDialogRef.close).toHaveBeenCalledWith({
        actionType: 'start',
        isAction: true,
      });
    });

    it('should preserve actionType in returned data', () => {
      createComponent('stop');
      fixture.componentInstance.confirmAction();
      expect(mockDialogRef.close).toHaveBeenCalledWith({
        actionType: 'stop',
        isAction: true,
      });
    });
  });

  describe('template', () => {
    it('should have Yes button that triggers confirmAction', () => {
      createComponent('start');
      const yesButton = fixture.nativeElement.querySelectorAll('button')[1];
      yesButton.click();
      expect(mockDialogRef.close).toHaveBeenCalledWith({
        actionType: 'start',
        isAction: true,
      });
    });

    it('should have No button with mat-dialog-close', () => {
      createComponent('start');
      const noButton = fixture.nativeElement.querySelector('button[mat-dialog-close]');
      expect(noButton).toBeTruthy();
    });
  });
});

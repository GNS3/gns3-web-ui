import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MatDialogRef } from '@angular/material/dialog';
import { ModelTypeHelpDialogComponent } from './model-type-help-dialog.component';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('ModelTypeHelpDialogComponent', () => {
  let fixture: ComponentFixture<ModelTypeHelpDialogComponent>;
  let component: ModelTypeHelpDialogComponent;
  let mockDialogRef: any;

  beforeEach(async () => {
    mockDialogRef = {
      close: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ModelTypeHelpDialogComponent],
      providers: [{ provide: MatDialogRef, useValue: mockDialogRef }],
    }).compileComponents();

    fixture = TestBed.createComponent(ModelTypeHelpDialogComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
  });

  describe('Creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have help icon in title', () => {
      fixture.detectChanges();
      const icon = fixture.debugElement.query(By.css('mat-icon'));
      expect(icon.nativeElement.textContent.trim()).toBe('help_outline');
    });

    it('should have "Got it" button', () => {
      fixture.detectChanges();
      const button = fixture.debugElement.query(By.css('button'));
      expect(button.nativeElement.textContent.trim()).toBe('Got it');
    });
  });

  describe('close()', () => {
    it('should call dialogRef.close()', () => {
      component.close();
      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });

  describe('Button click', () => {
    it('should call close() when button is clicked', () => {
      const closeSpy = vi.spyOn(component, 'close');
      fixture.detectChanges();
      const button = fixture.debugElement.query(By.css('button'));
      button.nativeElement.click();
      expect(closeSpy).toHaveBeenCalled();
    });
  });
});

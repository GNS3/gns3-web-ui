import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { InformationDialogComponent } from './information-dialog.component';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('InformationDialogComponent', () => {
  let component: InformationDialogComponent;
  let fixture: ComponentFixture<InformationDialogComponent>;
  let mockDialogRef: { close: ReturnType<typeof vi.fn> };

  const testMessage = 'Are you sure you want to proceed?';

  beforeEach(async () => {
    vi.clearAllMocks();

    mockDialogRef = {
      close: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [InformationDialogComponent],
      providers: [{ provide: MatDialogRef, useValue: mockDialogRef }],
    }).compileComponents();

    fixture = TestBed.createComponent(InformationDialogComponent);
    component = fixture.componentInstance;
    component.confirmationMessage = testMessage;
    fixture.detectChanges();
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display confirmation message', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.information-dialog__message')?.textContent).toContain(testMessage);
  });

  it('should close dialog with false when No button is clicked', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const noButton = compiled.querySelector('.cancel-button') as HTMLButtonElement;

    noButton.click();
    fixture.detectChanges();

    expect(mockDialogRef.close).toHaveBeenCalledWith(false);
  });

  it('should close dialog with true when Yes button is clicked', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const yesButton = compiled.querySelector('.confirm-button') as HTMLButtonElement;

    yesButton.click();
    fixture.detectChanges();

    expect(mockDialogRef.close).toHaveBeenCalledWith(true);
  });

  it('should have onNoClick method that closes dialog with false', () => {
    component.onNoClick();
    expect(mockDialogRef.close).toHaveBeenCalledWith(false);
  });

  it('should have onYesClick method that closes dialog with true', () => {
    component.onYesClick();
    expect(mockDialogRef.close).toHaveBeenCalledWith(true);
  });
});

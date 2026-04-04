import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QuestionDialogComponent } from './question-dialog.component';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TestBed } from '@angular/core/testing';

describe('QuestionDialogComponent', () => {
  let component: QuestionDialogComponent;
  let mockDialogRef: MatDialogRef<QuestionDialogComponent>;

  const mockData = {
    title: 'Confirm Action',
    question: 'Are you sure?',
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    mockDialogRef = {
      close: vi.fn(),
    } as any as MatDialogRef<QuestionDialogComponent>;

    await TestBed.configureTestingModule({
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockData },
      ],
    }).compileComponents();

    component = TestBed.createComponent(QuestionDialogComponent).componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have dialogRef', () => {
    expect(component.dialogRef).toBeDefined();
  });

  it('should have data with title and question', () => {
    expect(component.data).toBeDefined();
    expect(component.data.title).toBe('Confirm Action');
    expect(component.data.question).toBe('Are you sure?');
  });

  it('should close dialog with false on onNoClick', () => {
    component.onNoClick();
    expect(mockDialogRef.close).toHaveBeenCalledWith(false);
  });

  it('should close dialog with true on onYesClick', () => {
    component.onYesClick();
    expect(mockDialogRef.close).toHaveBeenCalledWith(true);
  });

  it('should close dialog with false when onNoClick is called multiple times', () => {
    component.onNoClick();
    component.onNoClick();
    expect(mockDialogRef.close).toHaveBeenCalledTimes(2);
    expect(mockDialogRef.close).toHaveBeenCalledWith(false);
  });

  it('should close dialog with true when onYesClick is called multiple times', () => {
    component.onYesClick();
    component.onYesClick();
    expect(mockDialogRef.close).toHaveBeenCalledTimes(2);
    expect(mockDialogRef.close).toHaveBeenCalledWith(true);
  });
});

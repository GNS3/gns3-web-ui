import { describe, it, expect, vi } from 'vitest';
import { QuestionDialogComponent } from './question-dialog.component';

describe('QuestionDialogComponent', () => {
  it('should create', () => {
    expect(QuestionDialogComponent).toBeTruthy();
  });

  it('should have onNoClick method', () => {
    expect(typeof (QuestionDialogComponent.prototype as any).onNoClick).toBe('function');
  });

  it('should have onYesClick method', () => {
    expect(typeof (QuestionDialogComponent.prototype as any).onYesClick).toBe('function');
  });
});

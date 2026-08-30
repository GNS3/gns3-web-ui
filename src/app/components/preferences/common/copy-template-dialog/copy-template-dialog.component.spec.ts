import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { CopyTemplateDialogComponent } from './copy-template-dialog.component';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('CopyTemplateDialogComponent', () => {
  let component: CopyTemplateDialogComponent;
  let fixture: ComponentFixture<CopyTemplateDialogComponent>;

  let mockDialogRef: any;

  beforeEach(async () => {
    mockDialogRef = {
      close: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [CopyTemplateDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { templateName: 'Original Router' } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CopyTemplateDialogComponent);
    component = fixture.componentInstance;
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

  it('should prefill the name with "Copy of" the source template name', () => {
    expect(component.form.get('templateName')?.value).toBe('Copy of Original Router');
  });

  it('should close with the trimmed name when the form is valid', () => {
    component.form.get('templateName')?.setValue('  My Copy  ');
    component.submit();
    expect(mockDialogRef.close).toHaveBeenCalledWith('My Copy');
  });

  it('should not close when the name is empty', () => {
    component.form.get('templateName')?.setValue('');
    component.submit();
    expect(mockDialogRef.close).not.toHaveBeenCalled();
  });

  it('should close without a result on cancel', () => {
    component.cancel();
    expect(mockDialogRef.close).toHaveBeenCalledWith();
  });
});

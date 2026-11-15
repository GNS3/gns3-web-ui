import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { EditSnapshotDialogComponent } from './edit-snapshot-dialog.component';
import { Snapshot } from '@models/snapshot';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('EditSnapshotDialogComponent', () => {
  let fixture: ComponentFixture<EditSnapshotDialogComponent>;
  let mockDialogRef: any;
  let mockSnapshot: Snapshot;

  const createComponent = () => {
    fixture = TestBed.createComponent(EditSnapshotDialogComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  beforeEach(async () => {
    mockSnapshot = {
      snapshot_id: 'snap-1',
      name: 'Test Snapshot',
      created_at: Date.now(),
      project_id: 'proj-1',
      description: 'state before the migration',
    } as Snapshot;

    mockDialogRef = {
      close: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [EditSnapshotDialogComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { snapshot: mockSnapshot } },
        { provide: MatDialogRef, useValue: mockDialogRef },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('Creation', () => {
    it('should create the component', () => {
      const component = createComponent();
      expect(component).toBeTruthy();
    });

    it('should receive the snapshot from dialog data', () => {
      const component = createComponent();
      expect(component.data.snapshot).toEqual(mockSnapshot);
    });

    it('should prefill the description with the current one', () => {
      const component = createComponent();
      expect(component.description()).toBe('state before the migration');
    });

    it('should start with an empty description when the snapshot has none', () => {
      mockSnapshot = { ...mockSnapshot, description: undefined };
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [EditSnapshotDialogComponent],
        providers: [
          { provide: MAT_DIALOG_DATA, useValue: { snapshot: mockSnapshot } },
          { provide: MatDialogRef, useValue: mockDialogRef },
        ],
      });

      const component = createComponent();
      expect(component.description()).toBe('');
    });
  });

  describe('save', () => {
    it('should close with the trimmed description', () => {
      const component = createComponent();
      component.description.set('  updated text  ');

      component.save();

      expect(mockDialogRef.close).toHaveBeenCalledWith('updated text');
    });

    it('should close with an empty string when the description is cleared', () => {
      const component = createComponent();
      component.description.set('');

      component.save();

      expect(mockDialogRef.close).toHaveBeenCalledWith('');
    });

    it('should close with an empty string when the description is whitespace only', () => {
      const component = createComponent();
      component.description.set('   ');

      component.save();

      expect(mockDialogRef.close).toHaveBeenCalledWith('');
    });
  });

  describe('Template Rendering', () => {
    it('should show the snapshot name as context', () => {
      createComponent();

      const nameElement = fixture.nativeElement.querySelector('.edit-snapshot-dialog__name');
      expect(nameElement).toBeTruthy();
      expect(nameElement.textContent).toContain('Test Snapshot');
    });

    it('should have a description textarea preloaded with the current text', () => {
      createComponent();

      const textarea = fixture.nativeElement.querySelector('textarea');
      expect(textarea).toBeTruthy();
      expect(textarea.value).toBe('state before the migration');
    });

    it('should update the description signal when typing', () => {
      const component = createComponent();

      const textarea = fixture.nativeElement.querySelector('textarea');
      textarea.value = 'typed text';
      textarea.dispatchEvent(new Event('input'));

      expect(component.description()).toBe('typed text');
    });

    it('should explain that an empty description resets the default', () => {
      createComponent();

      const hint = fixture.nativeElement.querySelector('mat-hint');
      expect(hint?.textContent).toContain('reset to the default description');
    });

    it('should display Cancel and Save buttons', () => {
      createComponent();

      const buttons = fixture.nativeElement.querySelectorAll('button');
      const labels = Array.from(buttons).map((b: HTMLButtonElement) => b.textContent.trim());
      expect(labels).toContain('Cancel');
      expect(labels).toContain('Save');
    });
  });
});

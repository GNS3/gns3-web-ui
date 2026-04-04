import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { DeleteAceDialogComponent } from './delete-ace-dialog.component';
import { ACE, AceType } from '@models/api/ACE';

describe('DeleteAceDialogComponent', () => {
  let fixture: ComponentFixture<DeleteAceDialogComponent>;
  let mockDialogRef: { close: ReturnType<typeof vi.fn> };
  const mockAces: ACE[] = [
    {
      ace_id: 'ace-1',
      ace_type: AceType.user,
      path: '/path/to/ace1',
      propagate: true,
      allowed: true,
      role_id: 'role-1',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    },
    {
      ace_id: 'ace-2',
      ace_type: AceType.group,
      path: '/path/to/ace2',
      propagate: false,
      allowed: false,
      role_id: 'role-2',
      created_at: '2024-01-02',
      updated_at: '2024-01-02',
    },
  ];

  beforeEach(async () => {
    vi.clearAllMocks();

    mockDialogRef = { close: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [DeleteAceDialogComponent, MatDialogModule, MatButtonModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { aces: mockAces } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DeleteAceDialogComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
  });

  describe('rendering', () => {
    it('should display the dialog title', () => {
      const title = fixture.nativeElement.querySelector('h1[mat-dialog-title]');
      expect(title.textContent).toContain('Are you sure you want to delete the following ACEs ?');
    });

    it('should display all ACE paths', () => {
      const listItems = fixture.nativeElement.querySelectorAll('ul li');
      expect(listItems.length).toBe(2);
      expect(listItems[0].textContent).toBe('/path/to/ace1');
      expect(listItems[1].textContent).toBe('/path/to/ace2');
    });

    it('should have cancel and delete buttons', () => {
      const buttons = fixture.nativeElement.querySelectorAll('button');
      expect(buttons.length).toBe(2);
    });
  });

  describe('onCancel', () => {
    it('should close dialog without value when cancel is clicked', () => {
      const cancelButton = fixture.nativeElement.querySelector('button[color="accent"]');
      cancelButton.click();
      expect(mockDialogRef.close).toHaveBeenCalledWith();
    });
  });

  describe('onDelete', () => {
    it('should close dialog with true when delete is clicked', () => {
      const deleteButton = fixture.nativeElement.querySelector('.add-project-button');
      deleteButton.click();
      expect(mockDialogRef.close).toHaveBeenCalledWith(true);
    });
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DeleteGroupDialogComponent } from './delete-group-dialog.component';
import { Group } from '@models/groups/group';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('DeleteGroupDialogComponent', () => {
  let fixture: ComponentFixture<DeleteGroupDialogComponent>;
  let mockDialogRef: { close: ReturnType<typeof vi.fn> };
  const mockGroups: Group[] = [
    { name: 'Group A', user_group_id: '1', created_at: '', updated_at: '', is_builtin: false },
    { name: 'Group B', user_group_id: '2', created_at: '', updated_at: '', is_builtin: false },
  ];

  beforeEach(async () => {
    mockDialogRef = { close: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [DeleteGroupDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { groups: mockGroups } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DeleteGroupDialogComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should display group names in the dialog', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Are you sure you want to delete the following groups?');
    expect(compiled.querySelector('li:nth-child(1)')?.textContent).toBe('Group A');
    expect(compiled.querySelector('li:nth-child(2)')?.textContent).toBe('Group B');
  });

  it('should show cancel and delete buttons', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = compiled.querySelectorAll('button[mat-button]');
    expect(buttons.length).toBe(2);
    expect(buttons[0].textContent).toContain('No, cancel');
    expect(buttons[1].textContent).toContain('Yes, delete!');
  });

  it('should close dialog without value when cancel is clicked', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const cancelButton = compiled.querySelector('button[color="accent"]') as HTMLButtonElement;
    cancelButton.click();
    expect(mockDialogRef.close).toHaveBeenCalledWith();
  });

  it('should close dialog with true when delete is clicked', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const deleteButton = compiled.querySelector('button[tabindex="2"]') as HTMLButtonElement;
    deleteButton.click();
    expect(mockDialogRef.close).toHaveBeenCalledWith(true);
  });
});

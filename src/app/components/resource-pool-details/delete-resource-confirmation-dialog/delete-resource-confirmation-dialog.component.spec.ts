import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DeleteResourceConfirmationDialogComponent } from './delete-resource-confirmation-dialog.component';
import { DIALOG_DATA } from '@angular/cdk/dialog';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { Resource } from '@models/resourcePools/Resource';

describe('DeleteResourceConfirmationDialogComponent', () => {
  let component: DeleteResourceConfirmationDialogComponent;
  let fixture: ComponentFixture<DeleteResourceConfirmationDialogComponent>;
  let mockDialogRef: { close: ReturnType<typeof vi.fn> };
  let mockResource: Resource;

  beforeEach(async () => {
    mockDialogRef = {
      close: vi.fn(),
    };

    mockResource = {
      resource_id: 'res-123',
      resource_type: 'compute',
      name: 'server-1',
      created_at: '2024-01-01',
      updated_at: '2024-01-02',
    };

    await TestBed.configureTestingModule({
      imports: [DeleteResourceConfirmationDialogComponent, MatDialogModule, MatButtonModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: DIALOG_DATA, useValue: mockResource },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DeleteResourceConfirmationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('component creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have dialogRef from MatDialogRef', () => {
      expect(component.dialogRef).toBeDefined();
    });

    it('should receive resource via MAT_DIALOG_DATA', () => {
      expect(component.data).toBeDefined();
      expect(component.data.resource_id).toBe('res-123');
      expect(component.data.resource_type).toBe('compute');
      expect(component.data.name).toBe('server-1');
    });
  });

  describe('template', () => {
    it('should show delete confirmation title with resource type and name', () => {
      const title = fixture.nativeElement.querySelector('h2[mat-dialog-title]');
      expect(title.textContent).toContain('compute');
      expect(title.textContent).toContain('server-1');
    });

    it('should have cancel button that closes dialog without data', () => {
      const cancelButton = fixture.nativeElement.querySelector('button:nth-child(1)');
      cancelButton.click();
      fixture.detectChanges();

      expect(mockDialogRef.close).toHaveBeenCalledTimes(1);
      expect(mockDialogRef.close).toHaveBeenCalledWith();
    });

    it('should have delete button that closes dialog with resource data', () => {
      const deleteButton = fixture.nativeElement.querySelector('button:nth-child(2)');
      deleteButton.click();
      fixture.detectChanges();

      expect(mockDialogRef.close).toHaveBeenCalledTimes(1);
      expect(mockDialogRef.close).toHaveBeenCalledWith(mockResource);
    });
  });
});

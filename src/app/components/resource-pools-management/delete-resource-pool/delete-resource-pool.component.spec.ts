import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DeleteResourcePoolComponent } from './delete-resource-pool.component';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { ResourcePool } from '@models/resourcePools/ResourcePool';

describe('DeleteResourcePoolComponent', () => {
  let component: DeleteResourcePoolComponent;
  let fixture: ComponentFixture<DeleteResourcePoolComponent>;
  let mockDialogRef: { close: ReturnType<typeof vi.fn> };

  const mockPools: ResourcePool[] = [
    {
      name: 'Pool 1',
      created_at: '2024-01-01',
      updated_at: '2024-01-02',
      resource_pool_id: 'pool-1',
    },
    {
      name: 'Pool 2',
      created_at: '2024-01-01',
      updated_at: '2024-01-02',
      resource_pool_id: 'pool-2',
    },
  ];

  beforeEach(async () => {
    mockDialogRef = {
      close: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [DeleteResourcePoolComponent, MatDialogModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { pools: mockPools } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DeleteResourcePoolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('data', () => {
    it('should contain pools passed via MAT_DIALOG_DATA', () => {
      expect(component.data).toBeDefined();
      expect(component.data.pools).toBeDefined();
      expect(component.data.pools.length).toBe(2);
      expect(component.data.pools[0].name).toBe('Pool 1');
      expect(component.data.pools[1].name).toBe('Pool 2');
    });
  });

  describe('onCancel', () => {
    it('should close dialog without result', () => {
      component.onCancel();
      expect(mockDialogRef.close).toHaveBeenCalledTimes(1);
      expect(mockDialogRef.close).toHaveBeenCalledWith();
    });
  });

  describe('onDelete', () => {
    it('should close dialog with true to confirm deletion', () => {
      component.onDelete();
      expect(mockDialogRef.close).toHaveBeenCalledTimes(1);
      expect(mockDialogRef.close).toHaveBeenCalledWith(true);
    });
  });
});

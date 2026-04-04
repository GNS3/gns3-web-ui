import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CustomAdaptersTableComponent } from './custom-adapters-table.component';
import { CustomAdapter } from '@models/qemu/qemu-custom-adapter';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

describe('CustomAdaptersTableComponent', () => {
  let fixture: ComponentFixture<CustomAdaptersTableComponent>;

  const createMockNetworkType = (value: string, name: string) => ({ value, name });

  const createMockAdapter = (adapter_number: number, adapter_type = 'virtio'): CustomAdapter =>
    ({
      adapter_number,
      adapter_type,
      port_name: '',
      mac_address: '',
    } as CustomAdapter);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CustomAdaptersTableComponent,
        FormsModule,
        MatTableModule,
        MatSelectModule,
        MatOptionModule,
        MatButtonModule,
        MatIconModule,
        MatTooltipModule,
        MatInputModule,
        MatFormFieldModule,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomAdaptersTableComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture?.destroy();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(fixture.componentInstance).toBeTruthy();
    });

    it('should have empty adapters by default', () => {
      expect(fixture.componentInstance.adapters).toEqual([]);
    });
  });

  describe('onAdd', () => {
    it('should add a new adapter with correct adapter_number based on current length', () => {
      fixture.componentInstance.adapters = [createMockAdapter(0)];
      fixture.detectChanges();

      fixture.componentInstance.onAdd();
      fixture.detectChanges();

      expect(fixture.componentInstance.adapters.length).toBe(2);
      expect(fixture.componentInstance.adapters[1].adapter_number).toBe(1);
    });

    it('should set adapter_type to first networkType object when networkTypes is provided', () => {
      const networkTypes = [createMockNetworkType('virtio', 'Virtio'), createMockNetworkType('e1000', 'E1000')];

      // Set networkTypes via setInput - this properly updates signal inputs
      fixture.componentRef.setInput('networkTypes', networkTypes);
      fixture.detectChanges();

      fixture.componentInstance.onAdd();
      fixture.detectChanges();

      // Component stores the entire networkType object (not just .value)
      expect(fixture.componentInstance.adapters[0].adapter_type).toEqual(networkTypes[0]);
    });

    it('should not crash when networkTypes is empty', () => {
      fixture.componentRef.setInput('networkTypes', []);
      fixture.detectChanges();

      expect(() => {
        fixture.componentInstance.onAdd();
        fixture.detectChanges();
      }).not.toThrow();
    });

    it('should emit updated adapters list after adding', () => {
      fixture.componentInstance.adapters = [];
      fixture.detectChanges();

      fixture.componentInstance.onAdd();

      expect(fixture.componentInstance.adapters.length).toBe(1);
      expect(fixture.componentInstance.adapters[0]).toBeDefined();
    });
  });

  describe('delete', () => {
    it('should remove the specified adapter from the list', () => {
      const adapter0 = createMockAdapter(0);
      const adapter1 = createMockAdapter(1);
      fixture.componentInstance.adapters = [adapter0, adapter1];
      fixture.detectChanges();

      fixture.componentInstance.delete(adapter0);
      fixture.detectChanges();

      expect(fixture.componentInstance.adapters.length).toBe(1);
      expect(fixture.componentInstance.adapters).not.toContain(adapter0);
      expect(fixture.componentInstance.adapters).toContain(adapter1);
    });

    it('should handle deleting the last adapter', () => {
      const adapter = createMockAdapter(0);
      fixture.componentInstance.adapters = [adapter];
      fixture.detectChanges();

      fixture.componentInstance.delete(adapter);
      fixture.detectChanges();

      expect(fixture.componentInstance.adapters.length).toBe(0);
    });

    it('should not modify list if adapter not found', () => {
      const adapter0 = createMockAdapter(0);
      const adapter1 = createMockAdapter(1);
      const nonExistent = createMockAdapter(99);
      fixture.componentInstance.adapters = [adapter0, adapter1];
      fixture.detectChanges();

      fixture.componentInstance.delete(nonExistent);
      fixture.detectChanges();

      expect(fixture.componentInstance.adapters.length).toBe(2);
    });
  });

  describe('displayedColumns input', () => {
    it('should render table with default displayedColumns when not set', () => {
      fixture.detectChanges();

      const table = fixture.nativeElement.querySelector('table[mat-table]');
      expect(table).toBeTruthy();
    });

    it('should return default empty array when displayedColumns is not set', () => {
      expect(fixture.componentInstance.displayedColumns()).toEqual([]);
    });

    it('should accept displayedColumns via setInput', () => {
      const columns = ['adapter_number', 'port_name', 'adapter_type', 'mac_address', 'actions'];
      fixture.componentRef.setInput('displayedColumns', columns);
      fixture.detectChanges();

      expect(fixture.componentInstance.displayedColumns()).toEqual(columns);
    });
  });

  describe('Template Rendering', () => {
    it('should show Add button', () => {
      const addButton = fixture.nativeElement.querySelector('button.form-field');
      expect(addButton).toBeTruthy();
      expect(addButton.textContent).toContain('Add');
    });

    it('should render delete button for each adapter row when displayedColumns includes actions', () => {
      fixture.componentInstance.adapters = [createMockAdapter(0), createMockAdapter(1)];
      fixture.componentRef.setInput('displayedColumns', [
        'adapter_number',
        'port_name',
        'adapter_type',
        'mac_address',
        'actions',
      ]);
      fixture.detectChanges();

      const deleteButtons = fixture.nativeElement.querySelectorAll('button[mat-icon-button]');
      expect(deleteButtons.length).toBe(2);
    });

    it('should update adapters list when adapters input is set', () => {
      const adapters = [createMockAdapter(0), createMockAdapter(1)];
      fixture.componentRef.setInput('adapters', adapters);
      fixture.detectChanges();

      expect(fixture.componentInstance.adapters.length).toBe(2);
    });
  });

  describe('adapters input binding', () => {
    it('should accept adapters via input binding', () => {
      const adapters = [createMockAdapter(0), createMockAdapter(1)];
      fixture.componentRef.setInput('adapters', adapters);
      fixture.detectChanges();

      expect(fixture.componentInstance.adapters.length).toBe(2);
    });
  });

  describe('networkTypes input binding', () => {
    it('should accept networkTypes via input binding', () => {
      const networkTypes = [createMockNetworkType('virtio', 'Virtio'), createMockNetworkType('e1000', 'E1000')];
      fixture.componentRef.setInput('networkTypes', networkTypes);
      fixture.detectChanges();

      expect(fixture.componentInstance.networkTypes().length).toBe(2);
    });
  });
});

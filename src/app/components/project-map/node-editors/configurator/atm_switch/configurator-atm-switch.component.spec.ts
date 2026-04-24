import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { ConfiguratorDialogAtmSwitchComponent, NodeMapping } from './configurator-atm-switch.component';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { ChangeDetectorRef } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';

describe('ConfiguratorDialogAtmSwitchComponent', () => {
  let fixture: ComponentFixture<ConfiguratorDialogAtmSwitchComponent>;
  let component: ConfiguratorDialogAtmSwitchComponent;
  let mockDialogRef: { close: ReturnType<typeof vi.fn> };
  let mockNodeService: any;
  let mockToasterService: any;
  let mockChangeDetectorRef: any;

  const mockController = { id: 1 } as unknown as Controller;
  const mockNode = {
    node_id: 'node-1',
    name: 'ATM-Switch-1',
    properties: { mappings: { '0:0:1': '1:0:2', '0:0:3': '1:0:4' } },
  } as unknown as Node;

  beforeEach(async () => {
    vi.clearAllMocks();

    mockDialogRef = { close: vi.fn() };

    mockNodeService = {
      getNode: vi.fn().mockReturnValue(of(mockNode)),
      updateNode: vi.fn().mockReturnValue(of({})),
    };

    mockToasterService = {
      error: vi.fn(),
      success: vi.fn(),
    };

    mockChangeDetectorRef = {
      markForCheck: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ConfiguratorDialogAtmSwitchComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: NodeService, useValue: mockNodeService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: ChangeDetectorRef, useValue: mockChangeDetectorRef },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfiguratorDialogAtmSwitchComponent);
    component = fixture.componentInstance;
    component.controller = mockController;
    component.node = mockNode;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('component initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize nameForm with required name field', () => {
      expect(component.nameForm.get('name')).toBeTruthy();
      expect(component.nameForm.get('name')?.validator).toBeTruthy();
    });

    it('should initialize nameForm with useVpiOnly checkbox', () => {
      expect(component.nameForm.get('useVpiOnly')).toBeTruthy();
    });

    it('should initialize inputForm with sourcePort field', () => {
      expect(component.inputForm.get('sourcePort')).toBeTruthy();
    });

    it('should initialize inputForm with sourceVci field', () => {
      expect(component.inputForm.get('sourceVci')).toBeTruthy();
    });

    it('should initialize inputForm with destinationPort field', () => {
      expect(component.inputForm.get('destinationPort')).toBeTruthy();
    });

    it('should initialize inputForm with destinationVci field', () => {
      expect(component.inputForm.get('destinationVci')).toBeTruthy();
    });

    it('should initialize abstractForm with sourceVpi field', () => {
      expect(component.abstractForm.get('sourceVpi')).toBeTruthy();
    });

    it('should initialize abstractForm with destinationVpi field', () => {
      expect(component.abstractForm.get('destinationVpi')).toBeTruthy();
    });

    it('should initialize displayedColumns with portIn, portOut, actions', () => {
      expect(component.displayedColumns).toEqual(['portIn', 'portOut', 'actions']);
    });

    it('should initialize nodeMappings as Map', () => {
      expect(component.nodeMappings).toBeInstanceOf(Map);
    });

    it('should initialize nodeMappingsDataSource as array', () => {
      expect(Array.isArray(component.nodeMappingsDataSource)).toBe(true);
    });

    it('should load node data on init', () => {
      expect(mockNodeService.getNode).toHaveBeenCalledWith(mockController, mockNode);
    });

    it('should populate nodeMappingsDataSource from node properties', () => {
      expect(component.nodeMappingsDataSource.length).toBe(2);
      expect(component.nodeMappingsDataSource).toContainEqual({ portIn: '0:0:1', portOut: '1:0:2' });
      expect(component.nodeMappingsDataSource).toContainEqual({ portIn: '0:0:3', portOut: '1:0:4' });
    });

    it('should populate nodeMappings Map from node properties', () => {
      expect(component.nodeMappings.get('0:0:1')).toBe('1:0:2');
      expect(component.nodeMappings.get('0:0:3')).toBe('1:0:4');
    });

    it('should update nameForm with node name', () => {
      expect(component.nameForm.get('name')?.value).toBe('ATM-Switch-1');
    });
  });

  describe('delete', () => {
    it('should remove mapping from nodeMappingsDataSource', () => {
      const elemToDelete = component.nodeMappingsDataSource[0];
      const initialLength = component.nodeMappingsDataSource.length;

      component.delete(elemToDelete);

      expect(component.nodeMappingsDataSource.length).toBe(initialLength - 1);
      expect(component.nodeMappingsDataSource).not.toContainEqual(elemToDelete);
    });

    it('should not affect other mappings when deleting', () => {
      component.delete({ portIn: '0:0:1', portOut: '1:0:2' });

      expect(component.nodeMappingsDataSource).toContainEqual({ portIn: '0:0:3', portOut: '1:0:4' });
    });
  });

  describe('add', () => {
    beforeEach(() => {
      // Clear toaster mocks before each add test
      mockToasterService.error.mockClear();
    });

    it('should show error when inputForm is invalid', () => {
      component.inputForm.get('sourcePort')?.setValue('');
      component.inputForm.get('sourceVci')?.setValue('');
      component.inputForm.get('destinationPort')?.setValue('');
      component.inputForm.get('destinationVci')?.setValue('');
      component.nameForm.get('useVpiOnly')?.setValue(false);

      component.add();

      expect(mockToasterService.error).toHaveBeenCalledWith('Fill all required fields.');
    });

    it('should add mapping with VPI and VCI when useVpiOnly is false', () => {
      // Set both form control values
      component.inputForm.patchValue({
        sourcePort: '0',
        sourceVci: '1',
        destinationPort: '1',
        destinationVci: '2',
      });
      component.abstractForm.patchValue({
        sourceVpi: '5',
        destinationVpi: '10',
      });
      component.nameForm.patchValue({ useVpiOnly: false });

      component.add();

      expect(component.nodeMappingsDataSource).toContainEqual({
        portIn: '0:5:1',
        portOut: '1:10:2',
      });
    });

    it('should add mapping with VPI only when useVpiOnly is true', () => {
      component.inputForm.patchValue({
        sourcePort: '0',
        sourceVci: '32',
        destinationPort: '1',
        destinationVci: '64',
      });
      component.nameForm.patchValue({ useVpiOnly: true });

      component.add();

      expect(component.nodeMappingsDataSource).toContainEqual({
        portIn: '0:32',
        portOut: '1:64',
      });
    });

    it('should not add duplicate mapping to nodeMappingsDataSource', () => {
      // Set up a mapping that already exists
      const existingMapping = { portIn: '0:5:1', portOut: '1:10:2' };
      component.nodeMappingsDataSource = [existingMapping];
      const initialLength = component.nodeMappingsDataSource.length;

      // Set up form with the same values as existing mapping
      component.inputForm.patchValue({
        sourcePort: '0',
        sourceVci: '1',
        destinationPort: '1',
        destinationVci: '2',
      });
      component.abstractForm.patchValue({
        sourceVpi: '5',
        destinationVpi: '10',
      });

      component.add();

      // Should not add duplicate - length should remain the same
      expect(component.nodeMappingsDataSource.length).toBe(initialLength);
    });

    it('should show error when abstractForm is invalid with useVpiOnly false', () => {
      component.inputForm.patchValue({
        sourcePort: '0',
        sourceVci: '1',
        destinationPort: '1',
        destinationVci: '2',
      });
      component.abstractForm.get('sourceVpi')?.setValue('');
      component.abstractForm.get('destinationVpi')?.setValue('');
      component.nameForm.patchValue({ useVpiOnly: false });

      component.add();

      expect(mockToasterService.error).toHaveBeenCalledWith('Fill all required fields.');
    });
  });

  describe('clearUserInput', () => {
    it('should reset inputForm and abstractForm controls', () => {
      // Set form control values
      component.inputForm.patchValue({
        sourcePort: '5',
        sourceVci: '10',
        destinationPort: '15',
        destinationVci: '25',
      });
      component.abstractForm.patchValue({
        sourceVpi: '10',
        destinationVpi: '25',
      });

      component.clearUserInput();

      // Forms should be reset (null after reset)
      expect(component.inputForm.get('sourcePort')?.value).toBe(null);
      expect(component.inputForm.get('sourceVci')?.value).toBe(null);
      expect(component.inputForm.get('destinationPort')?.value).toBe(null);
      expect(component.inputForm.get('destinationVci')?.value).toBe(null);
      expect(component.abstractForm.get('sourceVpi')?.value).toBe(null);
      expect(component.abstractForm.get('destinationVpi')?.value).toBe(null);
    });
  });

  describe('strMapToObj', () => {
    it('should convert Map to object', () => {
      const map = new Map<string, string>();
      map.set('key1', 'value1');
      map.set('key2', 'value2');

      const result = component.strMapToObj(map);

      expect(result).toEqual({ key1: 'value1', key2: 'value2' });
    });

    it('should return empty object for empty Map', () => {
      const map = new Map<string, string>();

      const result = component.strMapToObj(map);

      expect(result).toEqual({});
    });
  });

  describe('onSaveClick', () => {
    it('should show error when nameForm is invalid', () => {
      component.nameForm.get('name')?.setValue('');

      component.onSaveClick();

      expect(mockToasterService.error).toHaveBeenCalledWith('Fill all required fields.');
      expect(mockNodeService.updateNode).not.toHaveBeenCalled();
    });

    it('should update node with form values when nameForm is valid', () => {
      component.nameForm.patchValue({ name: 'Updated-ATM-Switch' });
      component.nodeMappingsDataSource = [{ portIn: '0:5:1', portOut: '1:10:2' }];

      component.onSaveClick();

      expect(component.node.name).toBe('Updated-ATM-Switch');
      expect(component.node.properties.mappings).toEqual({ '0:5:1': '1:10:2' });
    });

    it('should call updateNode with controller and node', () => {
      component.nameForm.patchValue({ name: 'Updated-ATM-Switch' });
      component.nodeMappingsDataSource = [];

      component.onSaveClick();

      expect(mockNodeService.updateNode).toHaveBeenCalledWith(mockController, component.node);
    });

    it('should show success toast and close dialog on successful update', () => {
      component.nameForm.patchValue({ name: 'ATM-Switch-Saved' });
      component.nodeMappingsDataSource = [];
      (mockNodeService.updateNode as ReturnType<typeof vi.fn>).mockReturnValue({
        subscribe: vi.fn((observer) => {
          if (observer.next) observer.next();
          return { unsubscribe: vi.fn() };
        }),
      });

      component.onSaveClick();

      expect(mockToasterService.success).toHaveBeenCalledWith('Node ATM-Switch-Saved updated.');
      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should convert nodeMappingsDataSource to mappings object on node', () => {
      component.nodeMappingsDataSource = [
        { portIn: '0:5:1', portOut: '1:10:2' },
        { portIn: '0:6:3', portOut: '1:11:4' },
      ];

      component.onSaveClick();

      expect(component.node.properties.mappings).toEqual({
        '0:5:1': '1:10:2',
        '0:6:3': '1:11:4',
      });
    });

    it('should set useVpiOnly from nameForm', () => {
      component.nameForm.patchValue({ name: 'ATM-Switch', useVpiOnly: true });
      component.nodeMappingsDataSource = [];

      component.onSaveClick();

      expect(component.useVpiOnly).toBe(true);
    });
  });

  describe('onCancelClick', () => {
    it('should close dialog without data', () => {
      component.onCancelClick();

      expect(mockDialogRef.close).toHaveBeenCalledWith();
    });
  });

  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (ConfiguratorDialogAtmSwitchComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have delete method', () => {
      expect(typeof (ConfiguratorDialogAtmSwitchComponent.prototype as any).delete).toBe('function');
    });

    it('should have add method', () => {
      expect(typeof (ConfiguratorDialogAtmSwitchComponent.prototype as any).add).toBe('function');
    });

    it('should have clearUserInput method', () => {
      expect(typeof (ConfiguratorDialogAtmSwitchComponent.prototype as any).clearUserInput).toBe('function');
    });

    it('should have strMapToObj method', () => {
      expect(typeof (ConfiguratorDialogAtmSwitchComponent.prototype as any).strMapToObj).toBe('function');
    });

    it('should have onSaveClick method', () => {
      expect(typeof (ConfiguratorDialogAtmSwitchComponent.prototype as any).onSaveClick).toBe('function');
    });

    it('should have onCancelClick method', () => {
      expect(typeof (ConfiguratorDialogAtmSwitchComponent.prototype as any).onCancelClick).toBe('function');
    });
  });

  describe('exported types', () => {
    it('should export NodeMapping interface', () => {
      const nodeMapping: NodeMapping = { portIn: '0:0:0', portOut: '1:0:0' };
      expect(nodeMapping.portIn).toBe('0:0:0');
    });
  });

  describe('Error handling', () => {
    it('should show error toast when getNode fails', () => {
      mockNodeService.getNode.mockReturnValue(throwError(() => new Error('Failed to load node')));
      const cdrSpy = vi.spyOn(component['cd'], 'markForCheck');

      component.ngOnInit();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to load node');
      expect(cdrSpy).toHaveBeenCalled();
    });

    it('should show error toast when updateNode fails', () => {
      mockNodeService.updateNode.mockReturnValue(throwError(() => new Error('Failed to update node')));
      const cdrSpy = vi.spyOn(component['cd'], 'markForCheck');
      component.nameForm.patchValue({ name: 'Test Node' });

      component.onSaveClick();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to update node');
      expect(cdrSpy).toHaveBeenCalled();
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });
  });
});

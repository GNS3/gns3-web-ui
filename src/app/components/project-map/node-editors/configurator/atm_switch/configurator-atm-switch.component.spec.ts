import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { ConfiguratorDialogAtmSwitchComponent, NodeMapping } from './configurator-atm-switch.component';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';
import { AtmSwitchValidationService } from '@services/validation';
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
  let mockValidationService: any;

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

    mockValidationService = {
      validateMappingEntry: vi.fn().mockReturnValue({ isValid: true }),
      validateUniqueMapping: vi.fn().mockReturnValue({ isValid: true }),
    };

    await TestBed.configureTestingModule({
      imports: [ConfiguratorDialogAtmSwitchComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: NodeService, useValue: mockNodeService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: ChangeDetectorRef, useValue: mockChangeDetectorRef },
        { provide: AtmSwitchValidationService, useValue: mockValidationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfiguratorDialogAtmSwitchComponent);
    component = fixture.componentInstance;
    component.controller = mockController;
    component.node = mockNode;
    fixture.detectChanges();
  });

  afterEach(() => {
    if (fixture) fixture.destroy();
  });

  describe('component initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize model signals for form fields', () => {
      expect(component.nameSignal).toBeTruthy();
      expect(component.useVpiOnly).toBeTruthy();
      expect(component.sourcePort).toBeTruthy();
      expect(component.sourceVci).toBeTruthy();
      expect(component.destinationPort).toBeTruthy();
      expect(component.destinationVci).toBeTruthy();
      expect(component.sourceVpi).toBeTruthy();
      expect(component.destinationVpi).toBeTruthy();
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

    it('should update nameSignal with node name', () => {
      expect(component.nameSignal()).toBe('ATM-Switch-1');
    });

    it('should initialize useVpiOnly to false', () => {
      expect(component.useVpiOnly()).toBe(false);
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
      mockToasterService.error.mockClear();
      mockValidationService.validateMappingEntry.mockReturnValue({ isValid: true });
      mockValidationService.validateUniqueMapping.mockReturnValue({ isValid: true });
    });

    it('should validate mapping entry before adding', () => {
      component.sourcePort.set('0');
      component.sourceVci.set('1');
      component.destinationPort.set('1');
      component.destinationVci.set('2');
      component.sourceVpi.set('5');
      component.destinationVpi.set('10');

      component.add();

      expect(mockValidationService.validateMappingEntry).toHaveBeenCalledWith(
        '0', '1', '1', '2', '5', '10', false
      );
    });

    it('should show error when validation fails', () => {
      mockValidationService.validateMappingEntry.mockReturnValue({
        isValid: false,
        errorMessage: 'Source Port is required',
      });

      component.add();

      expect(mockToasterService.error).toHaveBeenCalledWith('Source Port is required');
    });

    it('should add VC mapping (with VPI and VCI) when useVpiOnly is false', () => {
      component.sourcePort.set('0');
      component.sourceVci.set('1');
      component.destinationPort.set('1');
      component.destinationVci.set('2');
      component.sourceVpi.set('5');
      component.destinationVpi.set('10');
      component.useVpiOnly.set(false);

      component.add();

      expect(component.nodeMappingsDataSource).toContainEqual({
        portIn: '0:5:1',
        portOut: '1:10:2',
      });
    });

    it('should add VP mapping (VCI only) when useVpiOnly is true', () => {
      component.sourcePort.set('0');
      component.sourceVci.set('32');
      component.destinationPort.set('1');
      component.destinationVci.set('33');
      component.useVpiOnly.set(true);

      component.add();

      expect(component.nodeMappingsDataSource).toContainEqual({
        portIn: '0:32',
        portOut: '1:33',
      });
    });

    it('should validate uniqueness before adding mapping', () => {
      component.sourcePort.set('0');
      component.sourceVci.set('1');
      component.destinationPort.set('1');
      component.destinationVci.set('2');
      component.useVpiOnly.set(true);

      component.add();

      expect(mockValidationService.validateUniqueMapping).toHaveBeenCalled();
    });

    it('should show error when mapping already exists', () => {
      mockValidationService.validateUniqueMapping.mockReturnValue({
        isValid: false,
        errorMessage: 'This mapping already exists',
      });

      component.sourcePort.set('0');
      component.sourceVci.set('1');
      component.destinationPort.set('1');
      component.destinationVci.set('2');
      component.useVpiOnly.set(true);

      component.add();

      expect(mockToasterService.error).toHaveBeenCalledWith('This mapping already exists');
    });

    it('should clear input fields after adding mapping', () => {
      component.sourcePort.set('0');
      component.sourceVci.set('1');
      component.destinationPort.set('1');
      component.destinationVci.set('2');
      component.sourceVpi.set('5');
      component.destinationVpi.set('10');

      component.add();

      expect(component.sourcePort()).toBe('');
      expect(component.sourceVci()).toBe('');
      expect(component.destinationPort()).toBe('');
      expect(component.destinationVci()).toBe('');
      expect(component.sourceVpi()).toBe('');
      expect(component.destinationVpi()).toBe('');
    });
  });

  describe('clearUserInput', () => {
    it('should clear all input fields', () => {
      component.sourcePort.set('0');
      component.sourceVci.set('1');
      component.destinationPort.set('1');
      component.destinationVci.set('2');
      component.sourceVpi.set('5');
      component.destinationVpi.set('10');

      component.clearUserInput();

      expect(component.sourcePort()).toBe('');
      expect(component.sourceVci()).toBe('');
      expect(component.destinationPort()).toBe('');
      expect(component.destinationVci()).toBe('');
      expect(component.sourceVpi()).toBe('');
      expect(component.destinationVpi()).toBe('');
    });
  });

  describe('onSaveClick', () => {
    beforeEach(() => {
      mockToasterService.error.mockClear();
      mockToasterService.success.mockClear();
    });

    it('should show error when name is empty', () => {
      component.nameSignal.set('');

      component.onSaveClick();

      expect(mockToasterService.error).toHaveBeenCalledWith('Fill all required fields.');
      expect(mockNodeService.updateNode).not.toHaveBeenCalled();
    });

    it('should update node with current values', () => {
      component.nameSignal.set('New-Name');
      component.useVpiOnly.set(true);

      component.onSaveClick();

      expect(component.node.name).toBe('New-Name');
      expect(mockNodeService.updateNode).toHaveBeenCalledWith(mockController, component.node);
    });

    it('should merge mappings into node properties', () => {
      component.nodeMappingsDataSource = [
        { portIn: '2:0:5', portOut: '3:0:6' },
        { portIn: '4:0:7', portOut: '5:0:8' },
      ];

      component.onSaveClick();

      expect(component.node.properties.mappings).toEqual({
        '2:0:5': '3:0:6',
        '4:0:7': '5:0:8',
      });
    });

    it('should show success message and close dialog on successful update', () => {
      component.nameSignal.set('Test-Name');

      component.onSaveClick();

      expect(mockToasterService.success).toHaveBeenCalledWith('Node Test-Name updated.');
      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should show error message on update failure', () => {
      mockNodeService.updateNode.mockReturnValue(
        throwError(() => {
          throw { error: { message: 'Update failed' } };
        })
      );
      component.nameSignal.set('Test-Name');

      component.onSaveClick();

      expect(mockToasterService.error).toHaveBeenCalledWith('Update failed');
    });
  });

  describe('onCancelClick', () => {
    it('should close dialog', () => {
      component.onCancelClick();

      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle node load error gracefully', () => {
      mockNodeService.getNode.mockReturnValue(
        throwError(() => {
          throw { error: { message: 'Load failed' } };
        })
      );

      // Create new fixture with error mock
      const errorFixture = TestBed.createComponent(ConfiguratorDialogAtmSwitchComponent);
      const errorComponent = errorFixture.componentInstance;
      errorComponent.controller = mockController;
      errorComponent.node = mockNode;

      // Trigger ngOnInit which calls getNode
      errorFixture.detectChanges();

      expect(mockToasterService.error).toHaveBeenCalledWith('Load failed');
    });
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { ConfiguratorDialogEthernetSwitchComponent } from './configurator-ethernet-switch.component';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';
import { BuiltInTemplatesConfigurationService } from '@services/built-in-templates-configuration.service';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { PortsComponent } from '@components/preferences/common/ports/ports.component';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ConfiguratorDialogEthernetSwitchComponent', () => {
  let fixture: ComponentFixture<ConfiguratorDialogEthernetSwitchComponent>;
  let component: ConfiguratorDialogEthernetSwitchComponent;
  let mockDialogRef: { close: ReturnType<typeof vi.fn> };
  let mockNodeService: any;
  let mockToasterService: any;
  let mockEthernetSwitchesConfigurationService: any;

  const mockController = { id: 1 } as unknown as Controller;
  const mockNode = {
    node_id: 'node-1',
    name: 'Ethernet-Switch-1',
    console_type: 'telnet',
    console_auto_start: false,
    properties: { ports_mapping: [] },
    tags: [] as string[],
  } as unknown as Node;

  beforeEach(async () => {
    mockDialogRef = { close: vi.fn() };

    mockNodeService = {
      getNode: vi.fn().mockReturnValue({ subscribe: vi.fn((cb) => cb(mockNode)) }),
      updateNode: vi.fn().mockReturnValue({ subscribe: vi.fn(() => {}) }),
    };

    mockToasterService = {
      error: vi.fn(),
      success: vi.fn(),
    };

    mockEthernetSwitchesConfigurationService = {
      getConsoleTypesForEthernetSwitches: vi.fn().mockReturnValue(['telnet', 'vnc', 'none']),
      getEtherTypesForEthernetSwitches: vi.fn().mockReturnValue(['Ethernet', 'FastEthernet', 'GigabitEthernet']),
      getPortTypesForEthernetSwitches: vi.fn().mockReturnValue(['access', 'trunk']),
    };

    await TestBed.configureTestingModule({
      imports: [ConfiguratorDialogEthernetSwitchComponent, MatChipsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: NodeService, useValue: mockNodeService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: BuiltInTemplatesConfigurationService, useValue: mockEthernetSwitchesConfigurationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfiguratorDialogEthernetSwitchComponent);
    component = fixture.componentInstance;
    component.controller = mockController;
    component.node = mockNode as Node;
    fixture.detectChanges();
  });

  describe('component initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have separatorKeysCodes for chip input', () => {
      expect(component.separatorKeysCodes).toBeDefined();
      expect(Array.isArray(component.separatorKeysCodes)).toBe(true);
      expect(component.separatorKeysCodes).toContain(13); // ENTER
      expect(component.separatorKeysCodes).toContain(188); // COMMA
    });

    it('should initialize inputForm with required name field', () => {
      expect(component.inputForm.get('name')).toBeTruthy();
      expect(component.inputForm.get('name')?.validator).toBeTruthy();
    });

    it('should initialize inputForm with console_type field', () => {
      expect(component.inputForm.get('console_type')).toBeTruthy();
    });
  });

  describe('getConfiguration', () => {
    it('should load console types from BuiltInTemplatesConfigurationService', () => {
      component.getConfiguration();
      expect(mockEthernetSwitchesConfigurationService.getConsoleTypesForEthernetSwitches).toHaveBeenCalled();
      expect(component.consoleTypes).toEqual(['telnet', 'vnc', 'none']);
    });
  });

  describe('addTag', () => {
    it('should add tag to node tags array', () => {
      component.node = { ...mockNode, tags: [] } as Node;
      const mockEvent = { value: 'new-tag', chipInput: { clear: vi.fn() } } as any;

      component.addTag(mockEvent);

      expect(component.node.tags).toContain('new-tag');
      expect(mockEvent.chipInput.clear).toHaveBeenCalled();
    });

    it('should not add empty tag', () => {
      component.node = { ...mockNode, tags: [] } as Node;
      const initialTags = [...(component.node.tags || [])];
      const mockEvent = { value: '', chipInput: { clear: vi.fn() } } as any;

      component.addTag(mockEvent);

      expect(component.node.tags).toEqual(initialTags);
    });

    it('should not add whitespace-only tag', () => {
      component.node = { ...mockNode, tags: [] } as Node;
      const initialTags = [...(component.node.tags || [])];
      const mockEvent = { value: '   ', chipInput: { clear: vi.fn() } } as any;

      component.addTag(mockEvent);

      expect(component.node.tags).toEqual(initialTags);
    });

    it('should initialize tags array if undefined', () => {
      component.node = { ...mockNode, tags: undefined } as any;
      const mockEvent = { value: 'test-tag', chipInput: { clear: vi.fn() } } as any;

      component.addTag(mockEvent);

      expect(component.node.tags).toEqual(['test-tag']);
    });

    it('should trim tag value before adding', () => {
      component.node = { ...mockNode, tags: [] } as Node;
      const mockEvent = { value: '  trimmed-tag  ', chipInput: { clear: vi.fn() } } as any;

      component.addTag(mockEvent);

      expect(component.node.tags).toContain('trimmed-tag');
    });
  });

  describe('removeTag', () => {
    it('should remove tag from node tags array', () => {
      component.node = { ...mockNode, tags: ['tag1', 'tag2', 'tag3'] } as Node;

      component.removeTag('tag2');

      expect(component.node.tags).not.toContain('tag2');
      expect(component.node.tags).toEqual(['tag1', 'tag3']);
    });

    it('should not throw when tags is undefined', () => {
      component.node = { ...mockNode, tags: undefined } as any;

      expect(() => component.removeTag('tag1')).not.toThrow();
    });

    it('should not modify array when tag not found', () => {
      component.node = { ...mockNode, tags: ['tag1', 'tag2'] } as Node;
      const originalTags = [...component.node.tags];

      component.removeTag('nonexistent');

      expect(component.node.tags).toEqual(originalTags);
    });

    it('should handle empty tags array', () => {
      component.node = { ...mockNode, tags: [] } as Node;

      expect(() => component.removeTag('tag1')).not.toThrow();
      expect(component.node.tags).toEqual([]);
    });
  });

  describe('onSaveClick', () => {
    it('should close dialog when form is invalid', () => {
      component.inputForm.get('name')?.setValue('');

      component.onSaveClick();

      expect(mockDialogRef.close).not.toHaveBeenCalled();
      expect(mockToasterService.error).toHaveBeenCalledWith('Fill all required fields.');
    });

    it('should update node with form values when form is valid', () => {
      component.node = { ...mockNode } as Node;
      component.inputForm.patchValue({
        name: 'Updated-Switch',
        console_type: 'vnc',
      });

      component.onSaveClick();

      expect(component.node.name).toBe('Updated-Switch');
      expect(component.node.console_type).toBe('vnc');
      expect(mockNodeService.updateNode).toHaveBeenCalledWith(mockController, component.node);
    });

    it('should show success toast and close dialog on successful update', () => {
      component.node = { ...mockNode } as Node;
      component.inputForm.patchValue({
        name: 'Switch-Updated',
        console_type: 'telnet',
      });

      (mockNodeService.updateNode as ReturnType<typeof vi.fn>).mockReturnValue({
        subscribe: vi.fn((callback) => {
          callback();
          return { unsubscribe: vi.fn() };
        }),
      });

      component.onSaveClick();

      expect(mockToasterService.success).toHaveBeenCalledWith('Node Switch-Updated updated.');
      expect(mockDialogRef.close).toHaveBeenCalled();
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
      expect(typeof (ConfiguratorDialogEthernetSwitchComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have getConfiguration method', () => {
      expect(typeof (ConfiguratorDialogEthernetSwitchComponent.prototype as any).getConfiguration).toBe('function');
    });

    it('should have onSaveClick method', () => {
      expect(typeof (ConfiguratorDialogEthernetSwitchComponent.prototype as any).onSaveClick).toBe('function');
    });

    it('should have onCancelClick method', () => {
      expect(typeof (ConfiguratorDialogEthernetSwitchComponent.prototype as any).onCancelClick).toBe('function');
    });

    it('should have addTag method', () => {
      expect(typeof (ConfiguratorDialogEthernetSwitchComponent.prototype as any).addTag).toBe('function');
    });

    it('should have removeTag method', () => {
      expect(typeof (ConfiguratorDialogEthernetSwitchComponent.prototype as any).removeTag).toBe('function');
    });
  });
});

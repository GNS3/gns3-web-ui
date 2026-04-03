import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { ConfiguratorDialogVpcsComponent } from './configurator-vpcs.component';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';
import { VpcsConfigurationService } from '@services/vpcs-configuration.service';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ConfiguratorDialogVpcsComponent', () => {
  let fixture: ComponentFixture<ConfiguratorDialogVpcsComponent>;
  let component: ConfiguratorDialogVpcsComponent;
  let mockDialogRef: { close: ReturnType<typeof vi.fn> };
  let mockNodeService: any;
  let mockToasterService: any;
  let mockVpcsConfigurationService: any;

  const mockController = { id: 1 } as unknown as Controller;
  const mockNode = {
    node_id: 'node-1',
    name: 'VPCS-1',
    console_type: 'telnet',
    console_auto_start: false,
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

    mockVpcsConfigurationService = {
      getConsoleTypes: vi.fn().mockReturnValue(['telnet', 'vnc']),
    };

    await TestBed.configureTestingModule({
      imports: [ConfiguratorDialogVpcsComponent, MatChipsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: NodeService, useValue: mockNodeService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: VpcsConfigurationService, useValue: mockVpcsConfigurationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfiguratorDialogVpcsComponent);
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
    });

    it('should initialize inputForm with required name field', () => {
      expect(component.inputForm.get('name')).toBeTruthy();
      expect(component.inputForm.get('name')?.validator).toBeTruthy();
    });

    it('should initialize inputForm with console_type field', () => {
      expect(component.inputForm.get('console_type')).toBeTruthy();
    });

    it('should initialize inputForm with console_auto_start field defaulting to false', () => {
      expect(component.inputForm.get('console_auto_start')).toBeTruthy();
      expect(component.inputForm.get('console_auto_start')?.value).toBe(false);
    });
  });

  describe('getConfiguration', () => {
    it('should load console types from VpcsConfigurationService', () => {
      component.getConfiguration();
      expect(mockVpcsConfigurationService.getConsoleTypes).toHaveBeenCalled();
      expect(component.consoleTypes).toEqual(['telnet', 'vnc']);
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

    it('should initialize tags array if undefined', () => {
      component.node = { ...mockNode, tags: undefined } as any;
      const mockEvent = { value: 'test-tag', chipInput: { clear: vi.fn() } } as any;

      component.addTag(mockEvent);

      expect(component.node.tags).toEqual(['test-tag']);
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
  });

  describe('onSaveClick', () => {
    it('should close dialog when form is invalid', () => {
      component.inputForm.get('name')?.setValue('');

      component.onSaveClick();

      expect(mockDialogRef.close).not.toHaveBeenCalled();
      expect(mockToasterService.error).toHaveBeenCalledWith('Fill all required fields.');
    });

    it('should update node and close dialog when form is valid', () => {
      component.node = { ...mockNode } as Node;
      component.inputForm.patchValue({
        name: 'Updated-VPCS',
        console_type: 'vnc',
        console_auto_start: true,
      });

      component.onSaveClick();

      expect(component.node.name).toBe('Updated-VPCS');
      expect(component.node.console_type).toBe('vnc');
      expect(component.node.console_auto_start).toBe(true);
      expect(mockNodeService.updateNode).toHaveBeenCalledWith(mockController, component.node);
    });

    it('should show success toast and close dialog on successful update', () => {
      component.node = { ...mockNode } as Node;
      component.inputForm.patchValue({
        name: 'VPCS-Updated',
        console_type: 'telnet',
        console_auto_start: false,
      });

      (mockNodeService.updateNode as ReturnType<typeof vi.fn>).mockReturnValue({
        subscribe: vi.fn((callback) => {
          callback();
          return { unsubscribe: vi.fn() };
        }),
      });

      component.onSaveClick();

      expect(mockToasterService.success).toHaveBeenCalledWith('Node VPCS-Updated updated.');
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
      expect(typeof (ConfiguratorDialogVpcsComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have getConfiguration method', () => {
      expect(typeof (ConfiguratorDialogVpcsComponent.prototype as any).getConfiguration).toBe('function');
    });

    it('should have onSaveClick method', () => {
      expect(typeof (ConfiguratorDialogVpcsComponent.prototype as any).onSaveClick).toBe('function');
    });

    it('should have onCancelClick method', () => {
      expect(typeof (ConfiguratorDialogVpcsComponent.prototype as any).onCancelClick).toBe('function');
    });

    it('should have addTag method', () => {
      expect(typeof (ConfiguratorDialogVpcsComponent.prototype as any).addTag).toBe('function');
    });

    it('should have removeTag method', () => {
      expect(typeof (ConfiguratorDialogVpcsComponent.prototype as any).removeTag).toBe('function');
    });
  });
});

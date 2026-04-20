import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { of } from 'rxjs';
import { ConfiguratorDialogNatComponent } from './configurator-nat.component';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('ConfiguratorDialogNatComponent', () => {
  let component: ConfiguratorDialogNatComponent;
  let fixture: ComponentFixture<ConfiguratorDialogNatComponent>;

  let mockDialogRef: any;
  let mockNodeService: any;
  let mockToasterService: any;

  let mockController: Controller;
  let mockNode: Node;

  const createMockNode = (): Node => ({
    node_id: 'node-1',
    name: 'NAT-1',
    tags: ['tag1', 'tag2'],
    command_line: '',
    compute_id: 'local',
    console: 3080,
    console_auto_start: false,
    console_host: 'localhost',
    console_type: 'telnet',
    first_port_name: 'eth0',
    height: 50,
    label: { rotation: 0, style: '', text: 'NAT-1', x: 0, y: 0 },
    locked: false,
    node_directory: '/tmp/node',
    node_type: 'nat',
    port_name_format: 'eth{0}',
    port_segment_size: 1,
    ports: [],
    project_id: 'project-1',
    properties: {} as any,
    status: 'stopped',
    symbol: 'nat',
    symbol_url: 'http://localhost:3080/v4/symbols/nat/raw',
    width: 50,
    x: 100,
    y: 100,
    z: 0,
  });

  const createMockController = (): Controller => ({
    id: 1,
    authToken: 'token',
    name: 'Test Controller',
    location: 'local',
    host: '127.0.0.1',
    port: 3080,
    path: '/',
    ubridge_path: '/usr/bin/ubridge',
    protocol: 'http:',
    username: 'admin',
    password: 'admin',
    tokenExpired: false,
    status: 'running',
  });

  beforeEach(async () => {
    mockController = createMockController();
    mockNode = createMockNode();

    mockDialogRef = {
      close: vi.fn(),
    };

    mockToasterService = {
      success: vi.fn(),
      error: vi.fn(),
    };

    mockNodeService = {
      getNode: vi.fn().mockReturnValue(of({ ...mockNode })),
      updateNode: vi.fn().mockReturnValue(of({ ...mockNode })),
    };

    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        MatDialogModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatChipsModule,
        MatIconModule,
        ConfiguratorDialogNatComponent,
      ],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: NodeService, useValue: mockNodeService },
        { provide: ToasterService, useValue: mockToasterService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfiguratorDialogNatComponent);
    component = fixture.componentInstance;
    // Set properties directly (as done in config-action.component.ts after dialog.open)
    component.controller = mockController;
    component.node = mockNode;
  });

  afterEach(() => {
    fixture?.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should fetch node and populate form', () => {
      component.ngOnInit();
      fixture.detectChanges();

      expect(mockNodeService.getNode).toHaveBeenCalled();
    });
  });

  describe('onSaveClick', () => {
    it('should call updateNode when form is valid', () => {
      component.generalSettingsForm = {
        valid: true,
        value: { name: 'NAT-1' },
      } as any;
      component.node = { ...mockNode };

      component.onSaveClick();

      expect(mockNodeService.updateNode).toHaveBeenCalled();
    });

    it('should close dialog on successful update', () => {
      component.generalSettingsForm = {
        valid: true,
        value: { name: 'NAT-1' },
      } as any;
      component.node = { ...mockNode };

      component.onSaveClick();

      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should show success toast on successful update', () => {
      component.generalSettingsForm = {
        valid: true,
        value: { name: 'NAT-1' },
      } as any;
      component.node = { ...mockNode, name: 'NAT-1' };

      component.onSaveClick();

      expect(mockToasterService.success).toHaveBeenCalledWith('Node NAT-1 updated.');
    });

    it('should show error toast when form is invalid', () => {
      component.generalSettingsForm = {
        valid: false,
      } as any;

      component.onSaveClick();

      expect(mockToasterService.error).toHaveBeenCalledWith('Fill all required fields.');
      expect(mockNodeService.updateNode).not.toHaveBeenCalled();
    });
  });

  describe('onCancelClick', () => {
    it('should close dialog', () => {
      component.onCancelClick();

      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });

  describe('addTag', () => {
    it('should add tag to node tags', () => {
      const event = {
        value: 'new-tag',
        chipInput: { clear: vi.fn() },
        input: document.createElement('input'),
      } as any;

      component.node = { ...mockNode, tags: ['existing'] };
      component.addTag(event);

      expect(component.node.tags).toContain('new-tag');
    });

    it('should initialize tags array if undefined', () => {
      const event = {
        value: 'new-tag',
        chipInput: { clear: vi.fn() },
        input: document.createElement('input'),
      } as any;

      component.node = { ...mockNode, tags: undefined };
      component.addTag(event);

      expect(component.node.tags).toEqual(['new-tag']);
    });

    it('should clear chip input after adding tag', () => {
      const chipInputClearSpy = vi.fn();
      const event = {
        value: 'new-tag',
        chipInput: { clear: chipInputClearSpy },
        input: document.createElement('input'),
      } as any;

      component.node = { ...mockNode, tags: [] };
      component.addTag(event);

      expect(chipInputClearSpy).toHaveBeenCalled();
    });

    it('should not add empty tag', () => {
      const event = {
        value: '',
        chipInput: { clear: vi.fn() },
        input: document.createElement('input'),
      } as any;

      component.node = { ...mockNode, tags: [] };
      component.addTag(event);

      expect(component.node.tags).toEqual([]);
    });

    it('should not add whitespace-only tag', () => {
      const event = {
        value: '   ',
        chipInput: { clear: vi.fn() },
        input: document.createElement('input'),
      } as any;

      component.node = { ...mockNode, tags: [] };
      component.addTag(event);

      expect(component.node.tags).toEqual([]);
    });
  });

  describe('removeTag', () => {
    it('should remove tag from node tags', () => {
      component.node = { ...mockNode, tags: ['tag1', 'tag2', 'tag3'] };

      component.removeTag('tag2');

      expect(component.node.tags).not.toContain('tag2');
      expect(component.node.tags).toEqual(['tag1', 'tag3']);
    });

    it('should not modify tags if tag not found', () => {
      component.node = { ...mockNode, tags: ['tag1', 'tag2'] };

      component.removeTag('nonexistent');

      expect(component.node.tags).toEqual(['tag1', 'tag2']);
    });

    it('should handle undefined tags gracefully', () => {
      component.node = { ...mockNode, tags: undefined };

      expect(() => component.removeTag('tag')).not.toThrow();
    });
  });

  describe('dialog title', () => {
    it('should display node name in title', () => {
      component.name = 'NAT-1';
      fixture.detectChanges();

      const title = fixture.nativeElement.querySelector('h1[mat-dialog-title]');
      expect(title.textContent).toContain('NAT-1');
    });
  });
});

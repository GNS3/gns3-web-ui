import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { of } from 'rxjs';
import { ConfigEditorDialogComponent } from './config-editor.component';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';
import { Node } from '../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('ConfigEditorDialogComponent', () => {
  let component: ConfigEditorDialogComponent;
  let fixture: ComponentFixture<ConfigEditorDialogComponent>;

  let mockDialogRef: any;
  let mockNodeService: any;
  let mockToasterService: any;

  let mockController: Controller;
  let mockNode: Node;

  const createMockNode = (nodeType: string = 'vpcs'): Node =>
    ({
      node_id: 'node-1',
      name: 'Test-Node',
      tags: [],
      command_line: '',
      compute_id: 'local',
      console: 3080,
      console_auto_start: false,
      console_host: 'localhost',
      console_type: 'telnet',
      first_port_name: 'eth0',
      height: 50,
      label: { rotation: 0, style: '', text: 'Test-Node', x: 0, y: 0 },
      locked: false,
      node_directory: '/tmp/node',
      node_type: nodeType,
      port_name_format: 'eth{0}',
      port_segment_size: 1,
      ports: [],
      project_id: 'project-1',
      properties: {} as any,
      status: 'stopped',
      symbol: 'router',
      symbol_url: 'http://localhost:3080/v4/symbols/router/raw',
      width: 50,
      x: 100,
      y: 100,
      z: 0,
    });

  const createMockController = (): Controller =>
    ({
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
    mockNode = createMockNode('vpcs');

    mockDialogRef = {
      close: vi.fn(),
    };

    mockToasterService = {
      success: vi.fn(),
      error: vi.fn(),
    };

    mockNodeService = {
      getStartupConfiguration: vi.fn().mockReturnValue(of('startup config content')),
      getPrivateConfiguration: vi.fn().mockReturnValue(of('private config content')),
      saveConfiguration: vi.fn().mockReturnValue(of({})),
      savePrivateConfiguration: vi.fn().mockReturnValue(of({})),
    };

    await TestBed.configureTestingModule({
      imports: [
        MatDialogModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        MatTabsModule,
        ConfigEditorDialogComponent,
      ],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: NodeService, useValue: mockNodeService },
        { provide: ToasterService, useValue: mockToasterService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfigEditorDialogComponent);
    component = fixture.componentInstance;
    component.controller = mockController;
    component.node = mockNode;
  });

  afterEach(() => {
    fixture?.destroy();
  });

  describe('component creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have dialogRef injected', () => {
      expect(component.dialogRef).toBeTruthy();
    });

    it('should have nodeService injected', () => {
      expect(component.nodeService).toBeTruthy();
    });
  });

  describe('ngOnInit', () => {
    it('should fetch startup configuration for vpcs node', () => {
      component.ngOnInit();
      fixture.detectChanges();

      expect(mockNodeService.getStartupConfiguration).toHaveBeenCalledWith(mockController, mockNode);
    });

    it('should store startup configuration in config property', () => {
      component.ngOnInit();
      fixture.detectChanges();

      expect(component.config).toBe('startup config content');
    });

    it('should not fetch private configuration for vpcs node type', () => {
      component.ngOnInit();
      fixture.detectChanges();

      expect(mockNodeService.getPrivateConfiguration).not.toHaveBeenCalled();
    });

    it('should fetch both configurations for iou node type', () => {
      component.node = createMockNode('iou');
      component.ngOnInit();
      fixture.detectChanges();

      expect(mockNodeService.getStartupConfiguration).toHaveBeenCalledWith(mockController, component.node);
      expect(mockNodeService.getPrivateConfiguration).toHaveBeenCalledWith(mockController, component.node);
    });

    it('should fetch both configurations for dynamips node type', () => {
      component.node = createMockNode('dynamips');
      component.ngOnInit();
      fixture.detectChanges();

      expect(mockNodeService.getStartupConfiguration).toHaveBeenCalledWith(mockController, component.node);
      expect(mockNodeService.getPrivateConfiguration).toHaveBeenCalledWith(mockController, component.node);
    });

    it('should store private configuration in privateConfig property for iou', () => {
      component.node = createMockNode('iou');
      component.ngOnInit();
      fixture.detectChanges();

      expect(component.privateConfig).toBe('private config content');
    });

    it('should store private configuration in privateConfig property for dynamips', () => {
      component.node = createMockNode('dynamips');
      component.ngOnInit();
      fixture.detectChanges();

      expect(component.privateConfig).toBe('private config content');
    });
  });

  describe('onSaveClick', () => {
    it('should call saveConfiguration with controller, node and config', () => {
      component.config = 'new config';
      component.onSaveClick();

      expect(mockNodeService.saveConfiguration).toHaveBeenCalledWith(mockController, mockNode, 'new config');
    });

    it('should close dialog on successful save for vpcs node', () => {
      component.onSaveClick();

      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should show success toast with node name for vpcs node', () => {
      component.onSaveClick();

      expect(mockToasterService.success).toHaveBeenCalledWith(`Configuration for node ${mockNode.name} saved.`);
    });

    it('should also save private configuration for iou node', () => {
      component.node = createMockNode('iou');
      component.config = 'startup';
      component.privateConfig = 'private';
      component.onSaveClick();

      expect(mockNodeService.saveConfiguration).toHaveBeenCalledWith(mockController, component.node, 'startup');
      expect(mockNodeService.savePrivateConfiguration).toHaveBeenCalledWith(mockController, component.node, 'private');
    });

    it('should also save private configuration for dynamips node', () => {
      component.node = createMockNode('dynamips');
      component.config = 'startup';
      component.privateConfig = 'private';
      component.onSaveClick();

      expect(mockNodeService.saveConfiguration).toHaveBeenCalledWith(mockController, component.node, 'startup');
      expect(mockNodeService.savePrivateConfiguration).toHaveBeenCalledWith(mockController, component.node, 'private');
    });

    it('should close dialog after saving both configs for iou', () => {
      mockNodeService.savePrivateConfiguration.mockReturnValue(of({}));
      component.node = createMockNode('iou');
      component.config = 'startup';
      component.privateConfig = 'private';
      component.onSaveClick();

      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should show success toast after saving both configs for dynamips', () => {
      mockNodeService.savePrivateConfiguration.mockReturnValue(of({}));
      component.node = createMockNode('dynamips');
      component.onSaveClick();

      expect(mockToasterService.success).toHaveBeenCalledWith(`Configuration for node ${component.node.name} saved.`);
    });
  });

  describe('onCancelClick', () => {
    it('should close dialog without saving', () => {
      component.onCancelClick();

      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should not call any node service methods', () => {
      component.onCancelClick();

      expect(mockNodeService.saveConfiguration).not.toHaveBeenCalled();
      expect(mockNodeService.savePrivateConfiguration).not.toHaveBeenCalled();
    });

    it('should not show any toast messages', () => {
      component.onCancelClick();

      expect(mockToasterService.success).not.toHaveBeenCalled();
      expect(mockToasterService.error).not.toHaveBeenCalled();
    });
  });

  describe('template rendering', () => {
    it('should display node name in dialog title', () => {
      component.node = createMockNode('vpcs');
      fixture.detectChanges();

      const title = fixture.nativeElement.querySelector('h1[mat-dialog-title]');
      expect(title.textContent).toContain('Test-Node');
    });

    it('should have Cancel button', () => {
      fixture.detectChanges();

      const cancelButton = fixture.nativeElement.querySelector('button[color="accent"]');
      expect(cancelButton.textContent.trim()).toBe('Cancel');
    });

    it('should have Apply button', () => {
      fixture.detectChanges();

      const applyButton = fixture.nativeElement.querySelector('button[color="primary"]');
      expect(applyButton.textContent.trim()).toBe('Apply');
    });

    it('should call onCancelClick when Cancel button is clicked', () => {
      fixture.detectChanges();
      const cancelButton: HTMLButtonElement = fixture.nativeElement.querySelector('button[color="accent"]');
      cancelButton.click();

      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should call onSaveClick when Apply button is clicked', () => {
      fixture.detectChanges();
      const applyButton: HTMLButtonElement = fixture.nativeElement.querySelector('button[color="primary"]');
      applyButton.click();

      expect(mockNodeService.saveConfiguration).toHaveBeenCalled();
    });
  });
});

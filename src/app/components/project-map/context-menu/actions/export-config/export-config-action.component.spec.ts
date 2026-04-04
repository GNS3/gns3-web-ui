import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { of, throwError } from 'rxjs';
import { ExportConfigActionComponent } from './export-config-action.component';
import { ConfigDialogComponent } from '../../dialogs/config-dialog/config-dialog.component';
import { Node, Properties } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('ExportConfigActionComponent', () => {
  let fixture: ComponentFixture<ExportConfigActionComponent>;
  let mockNodeService: {
    getStartupConfiguration: ReturnType<typeof vi.fn>;
    getPrivateConfiguration: ReturnType<typeof vi.fn>;
  };
  let mockDialog: { open: ReturnType<typeof vi.fn> };
  let mockToasterService: { error: ReturnType<typeof vi.fn> };
  let mockDialogRef: { afterClosed: ReturnType<typeof vi.fn>; componentInstance: Record<string, unknown> };

  const createMockController = (): Controller => ({
    id: 1,
    authToken: '',
    name: 'Test Controller',
    location: 'local',
    host: 'localhost',
    port: 3080,
    path: '',
    ubridge_path: '',
    status: 'running',
    protocol: 'http:',
    username: '',
    password: '',
    tokenExpired: false,
  });

  const createMockNode = (nodeType: string, name = 'TestNode'): Node => ({
    node_id: `node-${nodeType}`,
    name,
    status: 'running',
    console_host: '0.0.0.0',
    node_type: nodeType,
    project_id: 'proj1',
    command_line: '',
    compute_id: 'local',
    height: 50,
    width: 50,
    x: 0,
    y: 0,
    z: 0,
    label: { text: '', x: 0, y: 0, style: '', rotation: 0 },
    locked: false,
    first_port_name: '',
    port_name_format: '',
    port_segment_size: 1,
    ports: [],
    properties: {} as Properties,
    symbol: '',
    symbol_url: '',
    console: 0,
    console_auto_start: false,
    console_type: '',
    node_directory: '',
  });

  beforeEach(async () => {
    mockDialogRef = {
      afterClosed: vi.fn().mockReturnValue(of(undefined)),
      componentInstance: {},
    };
    mockDialog = { open: vi.fn().mockReturnValue(mockDialogRef) };
    mockToasterService = { error: vi.fn() };
    mockNodeService = {
      getStartupConfiguration: vi.fn().mockReturnValue(of('mock startup config')),
      getPrivateConfiguration: vi.fn().mockReturnValue(of('mock private config')),
    };

    await TestBed.configureTestingModule({
      imports: [ExportConfigActionComponent, MatDialogModule, MatButtonModule, MatIconModule, MatMenuModule],
      providers: [
        { provide: MatDialog, useValue: mockDialog },
        { provide: NodeService, useValue: mockNodeService },
        { provide: ToasterService, useValue: mockToasterService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ExportConfigActionComponent);
  });

  afterEach(() => {
    fixture.destroy();
    vi.restoreAllMocks();
  });

  describe('button visibility', () => {
    it('should show button for vpcs node type', () => {
      fixture.componentRef.setInput('node', createMockNode('vpcs'));
      fixture.componentRef.setInput('controller', createMockController());
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button).toBeTruthy();
      expect(button.textContent).toContain('Export config');
    });

    it('should show button for dynamips node type', () => {
      fixture.componentRef.setInput('node', createMockNode('dynamips'));
      fixture.componentRef.setInput('controller', createMockController());
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button).toBeTruthy();
      expect(button.textContent).toContain('Export config');
    });

    it('should show button for iou node type', () => {
      fixture.componentRef.setInput('node', createMockNode('iou'));
      fixture.componentRef.setInput('controller', createMockController());
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button).toBeTruthy();
      expect(button.textContent).toContain('Export config');
    });

    it('should hide button for ethernet_switch node type', () => {
      fixture.componentRef.setInput('node', createMockNode('ethernet_switch'));
      fixture.componentRef.setInput('controller', createMockController());
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button).toBeFalsy();
    });

    it('should hide button when node is undefined', () => {
      fixture.componentRef.setInput('node', undefined);
      fixture.componentRef.setInput('controller', createMockController());
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button).toBeFalsy();
    });
  });

  describe('exportConfig for vpcs nodes', () => {
    it('should fetch startup configuration directly without opening dialog', () => {
      const mockNode = createMockNode('vpcs', 'my-vpcs');
      const mockController = createMockController();
      fixture.componentRef.setInput('node', mockNode);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      fixture.nativeElement.querySelector('button').click();
      fixture.detectChanges();

      expect(mockNodeService.getStartupConfiguration).toHaveBeenCalledWith(mockController, mockNode);
      expect(mockDialog.open).not.toHaveBeenCalled();
    });

    it('should trigger download with correct filename for vpcs', () => {
      const mockNode = createMockNode('vpcs', 'my-vpcs');
      fixture.componentRef.setInput('node', mockNode);
      fixture.componentRef.setInput('controller', createMockController());
      fixture.detectChanges();

      const clickSpy = vi.spyOn(MouseEvent.prototype, 'stopPropagation');
      const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue({
        setAttribute: vi.fn(),
        dispatchEvent: vi.fn(),
      } as unknown as HTMLAnchorElement);

      fixture.nativeElement.querySelector('button').click();
      fixture.detectChanges();

      expect(createElementSpy).toHaveBeenCalledWith('a');
    });

    it('should show error toaster when startup config fetch fails for vpcs', () => {
      mockNodeService.getStartupConfiguration.mockReturnValue(
        throwError(() => ({ error: { message: 'Fetch failed' } }))
      );
      const mockNode = createMockNode('vpcs');
      fixture.componentRef.setInput('node', mockNode);
      fixture.componentRef.setInput('controller', createMockController());
      fixture.detectChanges();

      fixture.nativeElement.querySelector('button').click();
      fixture.detectChanges();

      expect(mockToasterService.error).toHaveBeenCalled();
    });
  });

  describe('exportConfig for non-vpcs nodes', () => {
    it('should open config dialog for dynamips nodes', () => {
      const mockNode = createMockNode('dynamips');
      const mockController = createMockController();
      fixture.componentRef.setInput('node', mockNode);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      fixture.nativeElement.querySelector('button').click();
      fixture.detectChanges();

      expect(mockDialog.open).toHaveBeenCalledWith(ConfigDialogComponent, {
        panelClass: ['base-dialog-panel', 'export-config-action-dialog-panel'],
        autoFocus: false,
        disableClose: false,
      });
    });

    it('should open config dialog for iou nodes', () => {
      const mockNode = createMockNode('iou');
      fixture.componentRef.setInput('node', mockNode);
      fixture.componentRef.setInput('controller', createMockController());
      fixture.detectChanges();

      fixture.nativeElement.querySelector('button').click();
      fixture.detectChanges();

      expect(mockDialog.open).toHaveBeenCalled();
    });

    it('should fetch startup config when dialog closes with startup-config', () => {
      mockDialogRef.afterClosed.mockReturnValue(of('startup-config'));
      const mockNode = createMockNode('dynamips', 'router1');
      const mockController = createMockController();
      fixture.componentRef.setInput('node', mockNode);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      fixture.nativeElement.querySelector('button').click();
      fixture.detectChanges();

      expect(mockNodeService.getStartupConfiguration).toHaveBeenCalledWith(mockController, mockNode);
      expect(mockNodeService.getPrivateConfiguration).not.toHaveBeenCalled();
    });

    it('should fetch private config when dialog closes with private-config', () => {
      mockDialogRef.afterClosed.mockReturnValue(of('private-config'));
      const mockNode = createMockNode('iou', 'switch1');
      const mockController = createMockController();
      fixture.componentRef.setInput('node', mockNode);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      fixture.nativeElement.querySelector('button').click();
      fixture.detectChanges();

      expect(mockNodeService.getPrivateConfiguration).toHaveBeenCalledWith(mockController, mockNode);
      expect(mockNodeService.getStartupConfiguration).not.toHaveBeenCalled();
    });

    it('should fetch nothing when dialog closes with undefined', () => {
      mockDialogRef.afterClosed.mockReturnValue(of(undefined));
      const mockNode = createMockNode('dynamips');
      fixture.componentRef.setInput('node', mockNode);
      fixture.componentRef.setInput('controller', createMockController());
      fixture.detectChanges();

      fixture.nativeElement.querySelector('button').click();
      fixture.detectChanges();

      expect(mockNodeService.getStartupConfiguration).not.toHaveBeenCalled();
      expect(mockNodeService.getPrivateConfiguration).not.toHaveBeenCalled();
    });

    it('should show error toaster when startup config fetch fails for dynamips', () => {
      mockDialogRef.afterClosed.mockReturnValue(of('startup-config'));
      mockNodeService.getStartupConfiguration.mockReturnValue(
        throwError(() => ({ error: { message: 'Failed to export startup configuration' } }))
      );
      const mockNode = createMockNode('dynamips');
      fixture.componentRef.setInput('node', mockNode);
      fixture.componentRef.setInput('controller', createMockController());
      fixture.detectChanges();

      fixture.nativeElement.querySelector('button').click();
      fixture.detectChanges();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to export startup configuration');
    });

    it('should show error toaster when private config fetch fails for iou', () => {
      mockDialogRef.afterClosed.mockReturnValue(of('private-config'));
      mockNodeService.getPrivateConfiguration.mockReturnValue(
        throwError(() => ({ error: { message: 'Failed to export private configuration' } }))
      );
      const mockNode = createMockNode('iou');
      fixture.componentRef.setInput('node', mockNode);
      fixture.componentRef.setInput('controller', createMockController());
      fixture.detectChanges();

      fixture.nativeElement.querySelector('button').click();
      fixture.detectChanges();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to export private configuration');
    });
  });
});

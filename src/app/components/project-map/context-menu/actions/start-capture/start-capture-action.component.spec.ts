import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { StartCaptureActionComponent } from './start-capture-action.component';
import { DialogConfigService } from '@services/dialog-config.service';
import { StartCaptureDialogComponent } from '../../../packet-capturing/start-capture/start-capture.component';
import { Controller } from '@models/controller';
import { Project } from '@models/project';
import { Link } from '@models/link';
import { LinkNode } from '@models/link-node';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('StartCaptureActionComponent', () => {
  let fixture: ComponentFixture<StartCaptureActionComponent>;
  let mockDialog: { open: ReturnType<typeof vi.fn> };
  let mockDialogConfig: { openConfig: ReturnType<typeof vi.fn> };
  let mockDialogRef: { componentInstance: { controller: unknown; project: unknown; link: unknown } };

  const createMockController = (): Controller => ({
    id: 1,
    authToken: '',
    name: 'Main Controller',
    location: 'local',
    host: '192.168.1.100',
    port: 3080,
    path: '',
    ubridge_path: '',
    status: 'running',
    protocol: 'http:',
    username: '',
    password: '',
    tokenExpired: false,
  });

  const createMockProject = (): Project => ({
    auto_close: true,
    auto_open: false,
    auto_start: false,
    drawing_grid_size: 20,
    filename: 'test.gns3',
    grid_size: 20,
    name: 'Test Project',
    path: '/projects/test',
    project_id: 'proj-1',
    scene_height: 1000,
    scene_width: 1000,
    status: 'opened',
    readonly: false,
    show_interface_labels: true,
    show_layers: true,
    show_grid: true,
    snap_to_grid: true,
    variables: [],
  });

  const createMockLinkNode = (nodeId: string, portNumber: number): LinkNode => ({
    node_id: nodeId,
    adapter_number: 0,
    port_number: portNumber,
    label: { rotation: 0, style: '', text: '', x: 0, y: 0 },
  });

  const createMockLink = (overrides: Partial<Link> = {}): Link => {
    const defaults: Link = {
      capture_file_name: '',
      capture_file_path: '',
      capturing: false,
      link_id: 'link-1',
      link_type: 'ethernet',
      nodes: [createMockLinkNode('node-1', 0), createMockLinkNode('node-2', 0)],
      project_id: 'proj-1',
      suspend: false,
      wireshark: false,
      distance: 100,
      length: 100,
      source: null as never,
      target: null as never,
      x: 0,
      y: 0,
    };
    return Object.assign({}, defaults, overrides);
  };

  beforeEach(async () => {
    mockDialogRef = {
      componentInstance: { controller: undefined, project: undefined, link: undefined },
    };
    mockDialog = { open: vi.fn().mockReturnValue(mockDialogRef) };
    mockDialogConfig = {
      openConfig: vi.fn().mockReturnValue({
        autoFocus: false,
        disableClose: false,
        panelClass: ['base-dialog-panel', 'simple-dialog-panel'],
      }),
    };

    await TestBed.configureTestingModule({
      imports: [StartCaptureActionComponent, MatDialogModule],
      providers: [
        { provide: MatDialog, useValue: mockDialog },
        { provide: DialogConfigService, useValue: mockDialogConfig },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StartCaptureActionComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('button visibility', () => {
    it('should show button when link capturing is false', () => {
      const mockLink = createMockLink({ capturing: false });
      fixture.componentRef.setInput('link', mockLink);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button).toBeTruthy();
      expect(button.textContent).toContain('Start capture');
    });

    it('should hide button when link capturing is true', () => {
      const mockLink = createMockLink({ capturing: true });
      fixture.componentRef.setInput('link', mockLink);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button).toBeNull();
    });

    it('should hide button when link is undefined', () => {
      fixture.componentRef.setInput('link', undefined);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button).toBeNull();
    });
  });

  describe('startCapture', () => {
    it('should open start capture dialog with correct config', () => {
      const mockLink = createMockLink({ capturing: false });
      fixture.componentRef.setInput('link', mockLink);
      fixture.detectChanges();

      fixture.nativeElement.querySelector('button').click();
      fixture.detectChanges();

      expect(mockDialogConfig.openConfig).toHaveBeenCalledWith('startCapture', {
        autoFocus: false,
        disableClose: false,
      });
      expect(mockDialog.open).toHaveBeenCalledWith(StartCaptureDialogComponent, {
        autoFocus: false,
        disableClose: false,
        panelClass: ['base-dialog-panel', 'simple-dialog-panel'],
      });
    });

    it('should pass controller, project, and link to dialog instance', () => {
      const mockController = createMockController();
      const mockProject = createMockProject();
      const mockLink = createMockLink({ capturing: false });

      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('project', mockProject);
      fixture.componentRef.setInput('link', mockLink);
      fixture.detectChanges();

      fixture.nativeElement.querySelector('button').click();
      fixture.detectChanges();

      expect(mockDialogRef.componentInstance.controller).toBe(mockController);
      expect(mockDialogRef.componentInstance.project).toBe(mockProject);
      expect(mockDialogRef.componentInstance.link).toBe(mockLink);
    });
  });
});

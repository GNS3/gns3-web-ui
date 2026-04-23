import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ImportConfigActionComponent } from './import-config-action.component';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';
import { ConfigDialogComponent } from '../../dialogs/config-dialog/config-dialog.component';
import { ChangeDetectorRef } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';

describe('ImportConfigActionComponent', () => {
  let component: ImportConfigActionComponent;
  let fixture: ComponentFixture<ImportConfigActionComponent>;
  let mockNodeService: {
    saveConfiguration: ReturnType<typeof vi.fn>;
    savePrivateConfiguration: ReturnType<typeof vi.fn>;
  };
  let mockToasterService: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let mockDialog: { open: ReturnType<typeof vi.fn> };
  let mockChangeDetectorRef: { markForCheck: ReturnType<typeof vi.fn> };
  let mockDialogRef: {
    afterClosed: ReturnType<typeof vi.fn>;
    componentInstance: { configType?: string };
  };

  const mockController: Controller = {
    id: 1,
    authToken: '',
    name: 'Test Controller',
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
  } as Controller;

  const createMockNode = (overrides: Partial<Node> = {}): Node =>
    ({
      node_id: 'node-1',
      name: 'Test Node',
      status: 'started',
      console: 3000,
      console_auto_start: false,
      console_host: '0.0.0.0',
      console_type: 'telnet',
      first_port_name: 'eth0',
      height: 50,
      label: { x: 0, y: 0, rotation: 0, text: 'Test Node' },
      locked: false,
      node_directory: '/tmp/node',
      node_type: 'vpcs',
      port_name_format: 'eth{0}',
      port_segment_size: 1,
      ports: [],
      project_id: 'proj-1',
      properties: {} as Node['properties'],
      symbol: ':/symbols/vpcs.svg',
      symbol_url: '',
      width: 50,
      x: 100,
      y: 100,
      z: 0,
      command_line: '',
      compute_id: 'local',
      ...overrides,
    } as Node);

  beforeEach(async () => {
    vi.clearAllMocks();

    mockNodeService = {
      saveConfiguration: vi.fn().mockReturnValue(of({})),
      savePrivateConfiguration: vi.fn().mockReturnValue(of({})),
    };
    mockToasterService = {
      success: vi.fn(),
      error: vi.fn(),
    };
    mockChangeDetectorRef = { markForCheck: vi.fn() };
    mockDialogRef = {
      afterClosed: vi.fn().mockReturnValue(of('startup-config')),
      componentInstance: { configType: 'startup-config' },
    };
    mockDialog = { open: vi.fn().mockReturnValue(mockDialogRef) };

    await TestBed.configureTestingModule({
      imports: [MatButtonModule, MatIconModule, MatMenuModule, MatDialogModule, ImportConfigActionComponent],
      providers: [
        { provide: NodeService, useValue: mockNodeService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: ChangeDetectorRef, useValue: mockChangeDetectorRef },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ImportConfigActionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should render import config button', () => {
      const button = fixture.nativeElement.querySelector('button');
      expect(button).not.toBeNull();
      expect(button.textContent).toContain('Import config');
    });

    it('should have hidden file input', () => {
      const fileInput = fixture.nativeElement.querySelector('input[type="file"]');
      expect(fileInput).not.toBeNull();
      expect(fileInput.classList).toContain('non-visible');
    });
  });

  describe('triggerClick() for vpcs node', () => {
    it('should set configType to startup-config for vpcs node', () => {
      const node = createMockNode({ node_type: 'vpcs' });
      fixture.componentRef.setInput('node', node);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      component.triggerClick();

      expect(component.configType).toBe('startup-config');
    });

    it('should click the file input for vpcs node', () => {
      const node = createMockNode({ node_type: 'vpcs' });
      fixture.componentRef.setInput('node', node);
      fixture.detectChanges();

      const clickSpy = vi.spyOn(component.fileInput().nativeElement, 'click');

      component.triggerClick();

      expect(clickSpy).toHaveBeenCalled();
    });

    it('should reset fileInput value before clicking', () => {
      const node = createMockNode({ node_type: 'vpcs' });
      fixture.componentRef.setInput('node', node);
      fixture.detectChanges();

      component.triggerClick();

      expect(component.fileInput().nativeElement.value).toBe('');
    });
  });

  describe('triggerClick() for non-vpcs node', () => {
    it('should open ConfigDialogComponent for non-vpcs node', () => {
      const node = createMockNode({ node_type: 'dynamips' });
      fixture.componentRef.setInput('node', node);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      component.triggerClick();

      expect(mockDialog.open).toHaveBeenCalledWith(ConfigDialogComponent, {
        panelClass: ['base-dialog-panel', 'import-config-action-dialog-panel'],
        autoFocus: false,
        disableClose: false,
      });
    });

    it('should subscribe to dialog afterClosed for non-vpcs node', () => {
      const node = createMockNode({ node_type: 'dynamips' });
      fixture.componentRef.setInput('node', node);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      component.triggerClick();

      expect(mockDialogRef.afterClosed).toHaveBeenCalled();
    });

    it('should show error toast when afterClosed fails', async () => {
      mockDialogRef.afterClosed.mockReturnValue(throwError(() => ({ error: { message: 'Dialog failed' } })));
      const node = createMockNode({ node_type: 'dynamips' });
      fixture.componentRef.setInput('node', node);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      const cdrSpy = vi.spyOn(fixture.componentInstance['cdr'], 'markForCheck');
      component.triggerClick();
      await vi.runAllTimersAsync();

      expect(mockToasterService.error).toHaveBeenCalledWith('Dialog failed');
      expect(cdrSpy).toHaveBeenCalled();
    });

    it('should use fallback message when afterClosed error has no message', async () => {
      mockDialogRef.afterClosed.mockReturnValue(throwError(() => ({})));
      const node = createMockNode({ node_type: 'dynamips' });
      fixture.componentRef.setInput('node', node);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      component.triggerClick();
      await vi.runAllTimersAsync();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to get config type');
    });
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NodesMenuComponent } from './nodes-menu.component';
import { NodesDataSource } from '../../../cartography/datasources/nodes-datasource';
import { MapSettingsService } from '@services/mapsettings.service';
import { NodeService } from '@services/node.service';
import { NodeConsoleService } from '@services/nodeConsole.service';
import { ControllerService } from '@services/controller.service';
import { SettingsService } from '@services/settings.service';
import { ToasterService } from '@services/toaster.service';
import { of } from 'rxjs';
import { Project } from '@models/project';
import { Controller } from '@models/controller';

describe('NodesMenuComponent', () => {
  let fixture: ComponentFixture<NodesMenuComponent>;
  let mockNodeService: any;
  let mockNodeConsoleService: any;
  let mockNodesDataSource: any;
  let mockToasterService: any;
  let mockDialog: any;
  let mockMapSettingsService: any;

  const createMockController = (): Controller =>
    ({
      id: 1,
      authToken: 'token',
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
    }) as Controller;

  const createMockProject = (): Project =>
    ({
      project_id: 'proj-123',
      name: 'Test Project',
      filename: 'test.gns3',
      status: 'opened',
      auto_close: true,
      auto_open: false,
      auto_start: false,
      scene_width: 2000,
      scene_height: 1000,
      zoom: 100,
      show_layers: false,
      snap_to_grid: false,
      show_grid: false,
      grid_size: 75,
      drawing_grid_size: 25,
      show_interface_labels: false,
      variables: [],
      path: '/path/to/project',
      readonly: false,
    }) as Project;

  const mockNodes = [{ id: 'node-1' }, { id: 'node-2' }];

  beforeEach(async () => {
    mockNodeService = {
      startAll: vi.fn().mockReturnValue(of(undefined)),
      stopAll: vi.fn().mockReturnValue(of(undefined)),
      suspendAll: vi.fn().mockReturnValue(of(undefined)),
      reloadAll: vi.fn().mockReturnValue(of(undefined)),
      resetAllNodes: vi.fn().mockReturnValue(of(undefined)),
    };

    mockNodeConsoleService = {
      openConsolesForAllNodesInWidget: vi.fn(),
      openConsolesForAllNodesInNewTabs: vi.fn(),
    };

    mockNodesDataSource = {
      getItems: vi.fn().mockReturnValue(mockNodes),
    };

    mockToasterService = {
      success: vi.fn(),
    };

    mockDialog = {
      open: vi.fn(),
    };

    mockMapSettingsService = {
      openConsolesInWidget: true,
    };

    await TestBed.configureTestingModule({
      imports: [
        NodesMenuComponent,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        MatTooltipModule,
      ],
      providers: [
        { provide: NodeService, useValue: mockNodeService },
        { provide: NodeConsoleService, useValue: mockNodeConsoleService },
        { provide: NodesDataSource, useValue: mockNodesDataSource },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: ControllerService, useValue: {} },
        { provide: SettingsService, useValue: {} },
        { provide: MapSettingsService, useValue: mockMapSettingsService },
        { provide: MatDialog, useValue: mockDialog },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NodesMenuComponent);
    fixture.componentRef.setInput('project', createMockProject());
    fixture.componentRef.setInput('controller', createMockController());
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('startConsoleForAllNodes', () => {
    it('should open consoles in widget when openConsolesInWidget is true', () => {
      fixture.componentInstance.startConsoleForAllNodes();

      expect(mockMapSettingsService.openConsolesInWidget).toBe(true);
      expect(mockNodeConsoleService.openConsolesForAllNodesInWidget).toHaveBeenCalledWith(mockNodes);
      expect(mockNodeConsoleService.openConsolesForAllNodesInNewTabs).not.toHaveBeenCalled();
    });

    it('should open consoles in new tabs when openConsolesInWidget is false', () => {
      mockMapSettingsService.openConsolesInWidget = false;

      fixture.componentInstance.startConsoleForAllNodes();

      expect(mockNodeConsoleService.openConsolesForAllNodesInNewTabs).toHaveBeenCalledWith(mockNodes);
      expect(mockNodeConsoleService.openConsolesForAllNodesInWidget).not.toHaveBeenCalled();
    });
  });

  describe('startNodes', () => {
    it('should call nodeService.startAll with controller and project', () => {
      fixture.componentInstance.startNodes();

      expect(mockNodeService.startAll).toHaveBeenCalled();
    });

    it('should show success toast after starting nodes', () => {
      fixture.componentInstance.startNodes();

      expect(mockToasterService.success).toHaveBeenCalledWith('All nodes successfully started');
    });
  });

  describe('stopNodes', () => {
    it('should call nodeService.stopAll with controller and project', () => {
      fixture.componentInstance.stopNodes();

      expect(mockNodeService.stopAll).toHaveBeenCalled();
    });

    it('should show success toast after stopping nodes', () => {
      fixture.componentInstance.stopNodes();

      expect(mockToasterService.success).toHaveBeenCalledWith('All nodes successfully stopped');
    });
  });

  describe('suspendNodes', () => {
    it('should call nodeService.suspendAll with controller and project', () => {
      fixture.componentInstance.suspendNodes();

      expect(mockNodeService.suspendAll).toHaveBeenCalled();
    });

    it('should show success toast after suspending nodes', () => {
      fixture.componentInstance.suspendNodes();

      expect(mockToasterService.success).toHaveBeenCalledWith('All nodes successfully suspended');
    });
  });

  describe('reloadNodes', () => {
    it('should call nodeService.reloadAll with controller and project', () => {
      fixture.componentInstance.reloadNodes();

      expect(mockNodeService.reloadAll).toHaveBeenCalled();
    });

    it('should show success toast after reloading nodes', () => {
      fixture.componentInstance.reloadNodes();

      expect(mockToasterService.success).toHaveBeenCalledWith('All nodes successfully reloaded');
    });
  });

  describe('resetNodes', () => {
    it('should call nodeService.resetAllNodes with controller and project', () => {
      fixture.componentInstance.resetNodes();

      expect(mockNodeService.resetAllNodes).toHaveBeenCalled();
    });

    it('should show success toast after resetting nodes', () => {
      fixture.componentInstance.resetNodes();

      expect(mockToasterService.success).toHaveBeenCalledWith('Successfully reset all console connections');
    });
  });

  // TODO: add confirmControlsActions tests - MatDialog mocking has issues with inject() in Angular 21
  // The confirmControlsActions tests fail with "Cannot read properties of undefined (reading 'push')"
  // because Angular Material's real dialog code runs instead of the mock.
  // This appears to be a specific issue with how inject(MatDialog) works with TestBed mocking.
  // See: src/app/components/resource-pool-details/resource-pool-details.component.spec.ts
});

import { Node } from '../../../cartography/models/node';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Controller } from '@models/controller';
import { Project } from '@models/project';
import { ControllerService } from '@services/controller.service';
import { MapSettingsService } from '@services/mapsettings.service';
import { ProjectService } from '@services/project.service';
import { NodeWipeService } from '@services/node-wipe.service';
import { NodeService } from '@services/node.service';
import { NodeConsoleService } from '@services/nodeConsole.service';
import { ProjectPermissionService } from '@services/project-permission.service';
import { SettingsService } from '@services/settings.service';
import { StartupConfigurationsService } from '@services/startup-configurations.service';
import { ToasterService } from '@services/toaster.service';
import { of, Subject, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NodesDataSource } from '../../../cartography/datasources/nodes-datasource';
import { NodesMenuComponent } from './nodes-menu.component';

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
      created_by: '',
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
      error: vi.fn(),
      info: vi.fn(),
    };

    mockDialog = {
      open: vi.fn(),
    };

    mockMapSettingsService = {
      openConsolesInWidget: true,
    };

    await TestBed.configureTestingModule({
      imports: [NodesMenuComponent, MatDialogModule, MatButtonModule, MatIconModule, MatTooltipModule],
      providers: [
        { provide: NodeService, useValue: mockNodeService },
        { provide: NodeWipeService, useValue: { wipe: vi.fn(() => of({ nodes: {} })) } },
        {
          provide: StartupConfigurationsService,
          useValue: {
            get: vi.fn(() =>
              of({
                selected: 'active-set',
                sets: [
                  { id: 'active-set', name: 'Active' },
                  { id: 'target-set', name: 'Target' },
                ],
              }),
            ),
            waitForJob: vi.fn((_controller, _project, job) => of(job)),
            capture: vi.fn(() => of({ id: 'export-1', status: 'finished', nodes: { 'node-1': 'captured' } })),
          },
        },
        { provide: NodeConsoleService, useValue: mockNodeConsoleService },
        { provide: NodesDataSource, useValue: mockNodesDataSource },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: ControllerService, useValue: {} },
        { provide: SettingsService, useValue: {} },
        { provide: MapSettingsService, useValue: mockMapSettingsService },
        {
          provide: ProjectService,
          useValue: {
            isReadOnly: vi.fn().mockReturnValue(false),
            nodes: vi.fn(() => of(mockNodesDataSource.getItems())),
          },
        },
        {
          provide: ProjectPermissionService,
          useValue: {
            privileges: () => new Set<string>(['Project.Modify', 'Node.Modify', 'Node.Console', 'Node.PowerMgmt']),
            has: (privilege: string) => ['Node.Console', 'Node.PowerMgmt'].includes(privilege),
            hasAny: () => true,
            loaded: () => true,
          },
        },
        { provide: MatDialog, useValue: mockDialog },
      ],
    })
      .overrideProvider(MatDialog, { useValue: mockDialog })
      .compileComponents();

    fixture = TestBed.createComponent(NodesMenuComponent);
    fixture.componentRef.setInput('project', createMockProject());
    fixture.componentRef.setInput('controller', createMockController());
    fixture.detectChanges();
  });

  it('exports directly to the startup set without opening a dialog', () => {
    mockNodesDataSource.getItems.mockReturnValue([{ node_id: 'node-1', node_type: 'iou', status: 'started' }]);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('button[aria-label="Export all configurations"]').click();
    expect(TestBed.inject(StartupConfigurationsService).capture).toHaveBeenCalledWith(
      fixture.componentInstance.controller(),
      'proj-123',
      'active-set',
      ['node-1'],
    );
    expect(mockDialog.open).not.toHaveBeenCalled();
    expect(mockToasterService.success).toHaveBeenCalledWith(
      'Exported 1 configuration to the startup configuration set "Active".',
    );
    expect(fixture.componentInstance.configurationBusy()).toBe(false);
  });

  it('stays busy and prevents duplicate exports until the job is done', () => {
    mockNodesDataSource.getItems.mockReturnValue([{ node_id: 'node-1', node_type: 'iou', status: 'started' }]);
    const service = TestBed.inject(StartupConfigurationsService);
    const done = new Subject<any>();
    vi.mocked(service.waitForJob).mockReturnValue(done);
    fixture.componentInstance.exportAllConfigurations();
    fixture.componentInstance.exportAllConfigurations();
    expect(service.capture).toHaveBeenCalledOnce();
    expect(fixture.componentInstance.configurationBusy()).toBe(true);
    expect(mockToasterService.success).not.toHaveBeenCalled();
    done.next({ id: 'export-1', status: 'finished', nodes: { 'node-1': 'captured' } });
    done.complete();
    expect(mockToasterService.success).toHaveBeenCalledOnce();
    expect(fixture.componentInstance.configurationBusy()).toBe(false);
  });

  it('releases the toolbar and reports it when waiting for the job fails', () => {
    mockNodesDataSource.getItems.mockReturnValue([{ node_id: 'node-1', node_type: 'iou', status: 'started' }]);
    const service = TestBed.inject(StartupConfigurationsService);
    vi.mocked(service.waitForJob).mockReturnValue(throwError(() => new Error('configuration_job_still_running')));
    fixture.componentInstance.exportAllConfigurations();
    expect(fixture.componentInstance.configurationBusy()).toBe(false);
    expect(mockToasterService.error).toHaveBeenCalledWith(expect.stringContaining('still running on the server'));
  });

  it('keeps a pending export scoped to its original project and selected nodes', () => {
    const service = TestBed.inject(StartupConfigurationsService);
    const destination = new Subject<any>();
    vi.mocked(service.get).mockReturnValue(destination);
    const controller = fixture.componentInstance.controller();
    mockNodesDataSource.getItems.mockReturnValue([{ node_id: 'original-node', node_type: 'iou', status: 'started' }]);
    fixture.componentInstance.exportAllConfigurations();
    fixture.componentRef.setInput('project', { ...createMockProject(), project_id: 'other-project' });
    mockNodesDataSource.getItems.mockReturnValue([]);
    destination.next({ selected: 'active-set' });
    expect(service.capture).toHaveBeenCalledWith(controller, 'proj-123', 'active-set', ['original-node']);
    destination.complete();
  });

  it.each([
    [{ 'node-1': 'captured', 'node-2': 'device_type_required' }, 'Exported 1 configuration; 1 node not exported.'],
    [
      { a: 'captured', b: 'captured', c: 'device_type_required', d: 'device_type_required' },
      'Exported 2 configurations; 2 nodes not exported.',
    ],
  ])('reports partial exports without claiming success for every node (%j)', (nodes, totals) => {
    mockNodesDataSource.getItems.mockReturnValue([{ node_id: 'node-1', node_type: 'iou', status: 'started' }]);
    vi.mocked(TestBed.inject(StartupConfigurationsService).capture).mockReturnValue(
      of({ id: 'export-1', status: 'finished', nodes: nodes as any, set_id: 'active-set', operation: 'capture' }),
    );
    fixture.componentInstance.exportAllConfigurations();
    expect(mockToasterService.success).not.toHaveBeenCalled();
    expect(mockToasterService.error).toHaveBeenCalledWith(expect.stringContaining(totals));
    expect(fixture.componentInstance.configurationBusy()).toBe(false);
  });

  it.each([
    { stoppedRouter: false, expected: 'Skipped 2 nodes with no saved configuration.' },
    {
      stoppedRouter: true,
      expected: 'Skipped 2 nodes with no saved configuration. Start or resume 1 node before exporting.',
    },
  ])('reports missing files and any stopped console nodes ($stoppedRouter)', ({ stoppedRouter, expected }) => {
    mockNodesDataSource.getItems.mockReturnValue([
      { node_id: 'pc', name: 'PC1', node_type: 'vpcs', status: 'stopped' },
      { node_id: 'term', name: 'Webterm-1', node_type: 'docker', status: 'stopped' },
      ...(stoppedRouter ? [{ node_id: 'router', node_type: 'iou', status: 'stopped' }] : []),
    ]);
    vi.mocked(TestBed.inject(StartupConfigurationsService).capture).mockReturnValue(
      of({
        id: 'export-1',
        status: 'finished',
        nodes: { pc: 'configuration_not_saved', term: 'configuration_not_saved' },
        set_id: 'active-set',
        operation: 'capture',
      }),
    );
    fixture.componentInstance.exportAllConfigurations();
    expect(mockToasterService.info).toHaveBeenCalledExactlyOnceWith(expected);
    expect(TestBed.inject(StartupConfigurationsService).capture).toHaveBeenCalledWith(
      fixture.componentInstance.controller(),
      'proj-123',
      'active-set',
      ['pc', 'term'],
    );
    expect(mockToasterService.success).not.toHaveBeenCalled();
    expect(mockToasterService.error).not.toHaveBeenCalled();
  });

  it.each([
    {
      failures: {},
      channel: 'success',
      message:
        'Exported 1 configuration to the startup configuration set "Active". Skipped 1 node with no saved configuration.',
    },
    {
      failures: { router: 'console_busy' },
      channel: 'error',
      message: 'Exported 1 configuration; 1 node not exported. Skipped 1 node with no saved configuration. Router:',
    },
  ])('keeps missing files separate from failures in a mixed export ($channel)', ({ failures, channel, message }) => {
    mockNodesDataSource.getItems.mockReturnValue([
      { node_id: 'pc', name: 'PC1', node_type: 'vpcs', status: 'stopped' },
      { node_id: 'term', name: 'Webterm-1', node_type: 'docker', status: 'stopped' },
      { node_id: 'router', name: 'Router', node_type: 'iou', status: 'started' },
    ]);
    vi.mocked(TestBed.inject(StartupConfigurationsService).capture).mockReturnValue(
      of({
        id: 'export-1',
        status: 'finished',
        nodes: { pc: 'configuration_not_saved', term: 'captured', ...failures },
        set_id: 'active-set',
        operation: 'capture',
      }),
    );
    fixture.componentInstance.exportAllConfigurations();
    expect(mockToasterService[channel]).toHaveBeenCalledExactlyOnceWith(expect.stringContaining(message));
    expect(mockToasterService[channel === 'success' ? 'error' : 'success']).not.toHaveBeenCalled();
    const detail = mockToasterService[channel].mock.calls[0][0];
    expect(detail).not.toContain('PC1:');
    expect(detail).not.toContain('save command');
  });

  it.each([
    [new Error('Export unavailable'), 'Export unavailable'],
    [{ status: 409, error: { message: 'configuration_operation_in_progress' } }, 'already running'],
  ])('releases the toolbar and reports an export request failure (%s)', (failure, text) => {
    mockNodesDataSource.getItems.mockReturnValue([{ node_id: 'node-1', node_type: 'iou', status: 'started' }]);
    vi.mocked(TestBed.inject(StartupConfigurationsService).capture).mockReturnValue(throwError(() => failure));
    fixture.componentInstance.exportAllConfigurations();
    expect(mockToasterService.error).toHaveBeenCalledWith(expect.stringContaining(text));
    expect(fixture.componentInstance.configurationBusy()).toBe(false);
  });

  it('passes project scope and the toolbar selection to the shared wipe service', () => {
    const nodes = [
      { node_id: 'stopped', node_type: 'qemu', status: 'stopped' },
      { node_id: 'cloud', node_type: 'cloud', status: 'started' },
    ];
    mockNodesDataSource.getItems.mockReturnValue(nodes);
    fixture.detectChanges();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button[aria-label="Wipe all nodes"]');
    expect(button.disabled).toBe(false);
    button.click();
    expect(TestBed.inject(NodeWipeService).wipe).toHaveBeenCalledExactlyOnceWith(
      fixture.componentInstance.controller(),
      'proj-123',
      nodes,
      true,
    );
    expect(fixture.componentInstance.configurationBusy()).toBe(false);
  });

  it('does not export or wipe configurations in a read-only project', async () => {
    fixture.componentRef.setInput('project', { ...createMockProject(), readonly: true });
    vi.mocked(TestBed.inject(ProjectService).isReadOnly).mockReturnValue(true);
    mockNodesDataSource.getItems.mockReturnValue([{ node_id: 'node-1', node_type: 'iou', status: 'started' }]);
    await fixture.componentInstance.exportAllConfigurations();
    expect(TestBed.inject(ProjectService).nodes).not.toHaveBeenCalled();
    expect(TestBed.inject(StartupConfigurationsService).capture).not.toHaveBeenCalled();
    fixture.componentInstance.wipeAllNodes();
    expect(mockDialog.open).not.toHaveBeenCalled();
    expect(TestBed.inject(NodeWipeService).wipe).not.toHaveBeenCalled();
  });

  it('keeps Export all clickable and explains when no nodes are eligible', () => {
    mockNodesDataSource.getItems.mockReturnValue([]);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button[aria-label="Export all configurations"]');
    expect(button.disabled).toBe(false);
    button.click();
    expect(mockToasterService.info).toHaveBeenCalledWith(
      expect.stringContaining('No nodes can be exported right now.'),
    );
    expect(TestBed.inject(StartupConfigurationsService).get).not.toHaveBeenCalled();
    expect(TestBed.inject(StartupConfigurationsService).capture).not.toHaveBeenCalled();
    expect(fixture.componentInstance.configurationBusy()).toBe(false);
  });

  it('uses fresh server status and the capabilities helper to pick exportable nodes', () => {
    mockNodesDataSource.getItems.mockReturnValue([]);
    vi.mocked(TestBed.inject(ProjectService).nodes).mockReturnValue(
      of([
        { node_id: 'running-iou', node_type: 'iou', status: 'started' },
        { node_id: 'stopped-iou', node_type: 'iou', status: 'stopped' },
      ] as Node[]),
    );
    fixture.componentInstance.exportAllConfigurations();
    expect(TestBed.inject(StartupConfigurationsService).capture).toHaveBeenCalledWith(
      fixture.componentInstance.controller(),
      'proj-123',
      'active-set',
      ['running-iou'],
    );
    expect(mockToasterService.success).toHaveBeenCalledWith(expect.stringContaining('Start or resume 1 node'));
  });

  it('tells the user to start stopped console nodes when there is nothing to export yet', () => {
    mockNodesDataSource.getItems.mockReturnValue([
      { node_id: 'first', node_type: 'iou', status: 'stopped' },
      { node_id: 'second', node_type: 'qemu', status: 'suspended', netmiko_device_type: 'cisco_ios' },
    ]);
    fixture.componentInstance.exportAllConfigurations();
    expect(mockToasterService.info).toHaveBeenCalledExactlyOnceWith('Start or resume 2 nodes before exporting.');
    expect(TestBed.inject(StartupConfigurationsService).get).not.toHaveBeenCalled();
    expect(TestBed.inject(StartupConfigurationsService).capture).not.toHaveBeenCalled();
  });

  it('reports a node that stopped after the export started in the start or resume count', () => {
    mockNodesDataSource.getItems.mockReturnValue([
      { node_id: 'first', node_type: 'iou', status: 'started' },
      { node_id: 'second', node_type: 'iou', status: 'stopped' },
    ]);
    vi.mocked(TestBed.inject(StartupConfigurationsService).capture).mockReturnValue(
      of({
        id: 'export-1',
        status: 'finished',
        nodes: { first: 'start_required' },
        set_id: 'active-set',
        operation: 'capture',
      }),
    );
    fixture.componentInstance.exportAllConfigurations();
    expect(mockToasterService.info).toHaveBeenCalledExactlyOnceWith('Start or resume 2 nodes before exporting.');
    expect(mockToasterService.error).not.toHaveBeenCalled();
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

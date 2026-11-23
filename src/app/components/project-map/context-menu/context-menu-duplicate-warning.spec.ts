import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';
import { of } from 'rxjs';
import { MatMenuModule } from '@angular/material/menu';

import { ContextMenuComponent } from './context-menu.component';
import { Node } from '../../../cartography/models/node';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { ProjectService } from '@services/project.service';
import { ProjectPermissionService } from '@services/project-permission.service';
import { NodeService } from '@services/node.service';
import { DrawingService } from '@services/drawing.service';
import { ToasterService } from '@services/toaster.service';
import { NodesDataSource } from '../../../cartography/datasources/nodes-datasource';
import { DrawingsDataSource } from '../../../cartography/datasources/drawings-datasource';
import { LinksDataSource } from '../../../cartography/datasources/links-datasource';
import { MapLinksDataSource } from '../../../cartography/datasources/map-datasource';
import { LinkService } from '@services/link.service';
import { MapSettingsService } from '@services/mapsettings.service';
import { ProgressService } from '../../../common/progress/progress.service';
import { DeviceDetectorService } from 'ngx-device-detector';
import { DialogConfigService } from '@services/dialog-config.service';
import { MissingImagesDialogService } from '@components/projects/missing-images-dialog/missing-images-dialog.service';
import { NodeConsoleService } from '@services/nodeConsole.service';
import { PacketCaptureService } from '@services/packet-capture.service';
import { ProtocolHandlerService } from '@services/protocol-handler.service';
import { VncConsoleService } from '@services/vnc-console.service';
import { XpraConsoleService } from '@services/xpra-console.service';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';

/**
 * Wiring between the context menu and the Duplicate action.
 *
 * The action itself filters locked nodes and warns about them; what matters
 * here is that the menu hands it the WHOLE selection, otherwise the rows that
 * cannot be cloned are skipped silently.
 */
describe('ContextMenuComponent duplicate selection wiring', () => {
  let fixture: ComponentFixture<ContextMenuComponent>;
  let component: ContextMenuComponent;
  let toaster: { success: ReturnType<typeof vi.fn>; warning: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let nodeService: { duplicate: ReturnType<typeof vi.fn> };

  const controller = {
    authToken: 'token',
    id: 1,
    name: 'Local Controller',
    location: 'local',
    host: '127.0.0.1',
    port: 3080,
    path: '',
    ubridge_path: '',
    status: 'running',
    protocol: 'http:',
    username: 'admin',
    password: 'admin',
    tokenExpired: false,
  } as Controller;

  const project = {
    auto_close: false,
    auto_open: false,
    auto_start: false,
    drawing_grid_size: 25,
    filename: 'test.gns3',
    grid_size: 25,
    name: 'Test Project',
    path: '/path/to/project',
    project_id: 'project-123',
    scene_height: 1000,
    scene_width: 1000,
    status: 'opened',
    created_by: '',
    readonly: false,
    show_interface_labels: true,
    show_layers: true,
    show_grid: true,
    snap_to_grid: true,
    variables: [],
  } as Project;

  const createMockNode = (overrides: Partial<Node> = {}): Node =>
    ({
      command_line: '',
      compute_id: 'local',
      console: 3080,
      console_auto_start: false,
      console_host: '127.0.0.1',
      console_type: 'vnc',
      first_port_name: 'eth0',
      height: 50,
      label: { rotation: 0, style: '', text: 'Node', x: 0, y: 0 },
      locked: false,
      name: 'Test Node',
      node_directory: '/tmp/node',
      node_id: 'node-123',
      node_type: 'vpcs',
      port_name_format: 'eth{0}',
      port_segment_size: 4,
      ports: [],
      project_id: 'project-123',
      properties: {},
      status: 'stopped',
      symbol: 'router',
      symbol_url: '/symbols/router.svg',
      width: 50,
      x: 100,
      y: 100,
      z: 0,
      ...overrides,
    }) as Node;

  beforeEach(async () => {
    toaster = { success: vi.fn(), warning: vi.fn(), error: vi.fn() };
    nodeService = { duplicate: vi.fn((_controller: Controller, node: Node) => of(node)) };

    await TestBed.configureTestingModule({
      imports: [ContextMenuComponent, MatMenuModule],
      providers: [
        { provide: DomSanitizer, useValue: { bypassSecurityTrustStyle: (value: string) => value } },
        { provide: ProjectService, useValue: { isReadOnly: () => false } },
        {
          provide: ProjectPermissionService,
          useValue: {
            privileges: () => new Set(['Node.Allocate', 'Node.Modify', 'Node.PowerMgmt', 'Node.Console', 'Drawing.Allocate']),
            has: () => true,
            hasAny: () => true,
            loaded: () => true,
          },
        },
        { provide: NodeService, useValue: nodeService },
        { provide: DrawingService, useValue: { duplicate: vi.fn(() => of({})) } },
        { provide: ToasterService, useValue: toaster },
        { provide: NodesDataSource, useValue: { add: vi.fn() } },
        { provide: DrawingsDataSource, useValue: { add: vi.fn() } },
        // Injected by the sibling actions rendered next to Duplicate in the
        // real menu; this spec only asserts the duplicate wiring.
        { provide: LinksDataSource, useValue: { get: vi.fn(() => null) } },
        { provide: MapLinksDataSource, useValue: { get: vi.fn(() => []) } },
        { provide: LinkService, useValue: {} },
        { provide: MapSettingsService, useValue: {} },
        { provide: ProgressService, useValue: { start: vi.fn(), stop: vi.fn() } },
        { provide: DeviceDetectorService, useValue: { isMobile: () => false, isTablet: () => false } },
        { provide: DialogConfigService, useValue: {} },
        { provide: MissingImagesDialogService, useValue: {} },
        { provide: NodeConsoleService, useValue: {} },
        { provide: PacketCaptureService, useValue: {} },
        { provide: ProtocolHandlerService, useValue: {} },
        { provide: VncConsoleService, useValue: {} },
        { provide: XpraConsoleService, useValue: {} },
        { provide: MatDialog, useValue: { open: vi.fn() } },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ContextMenuComponent);
    component = fixture.componentInstance;
    component.project = project;
    component.controller = controller;
    fixture.detectChanges();
  });

  afterEach(() => {
    if (fixture) fixture.destroy();
    vi.restoreAllMocks();
  });

  it('warns about locked rows when a mixed selection is duplicated', async () => {
    const locked = createMockNode({ node_id: 'node-locked', name: 'Locked Node', locked: true });
    const unlocked = createMockNode({ node_id: 'node-free', name: 'Free Node' });

    component.openMenuForListOfElements([], [locked, unlocked], [], [], 0, 0);
    await vi.advanceTimersByTimeAsync(50);
    fixture.detectChanges();

    const duplicateButton = document.querySelector(
      '.cdk-overlay-container app-duplicate-action button'
    ) as HTMLButtonElement | null;
    expect(duplicateButton).not.toBeNull();

    duplicateButton!.click();
    await vi.advanceTimersByTimeAsync(50);

    expect(nodeService.duplicate).toHaveBeenCalledTimes(1);
    expect(nodeService.duplicate.mock.calls[0][1]).toBe(unlocked);
    expect(toaster.warning).toHaveBeenCalledWith('A locked node cannot be duplicated: Locked Node');
  });
});

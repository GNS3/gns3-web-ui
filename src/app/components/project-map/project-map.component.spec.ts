import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangeDetectorRef, signal, ViewContainerRef } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatDialog } from '@angular/material/dialog';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { of, Subject } from 'rxjs';
import { ProjectMapComponent } from './project-map.component';
import { ControllerService } from '@services/controller.service';
import { ProjectService } from '@services/project.service';
import { NodeService } from '@services/node.service';
import { LinkService } from '@services/link.service';
import { DrawingService } from '@services/drawing.service';
import { ProgressService } from '../../common/progress/progress.service';
import { ProjectWebServiceHandler } from '../../handlers/project-web-service-handler';
import { MapChangeDetectorRef } from '../../cartography/services/map-change-detector-ref';
import { NodeWidget } from '../../cartography/widgets/node';
import { DrawingsWidget } from '../../cartography/widgets/drawings';
import { LinkWidget } from '../../cartography/widgets/link';
import { LabelWidget } from '../../cartography/widgets/label';
import { InterfaceLabelWidget } from '../../cartography/widgets/interface-label';
import { EthernetLinkWidget } from '../../cartography/widgets/links/ethernet-link';
import { SerialLinkWidget } from '../../cartography/widgets/links/serial-link';
import { MapNodeToNodeConverter } from '../../cartography/converters/map/map-node-to-node-converter';
import { MapDrawingToDrawingConverter } from '../../cartography/converters/map/map-drawing-to-drawing-converter';
import { MapLabelToLabelConverter } from '../../cartography/converters/map/map-label-to-label-converter';
import { MapLinkToLinkConverter } from '../../cartography/converters/map/map-link-to-link-converter';
import { MapLinkNodeToLinkNodeConverter } from '../../cartography/converters/map/map-link-node-to-link-node-converter';
import { NodesDataSource } from '../../cartography/datasources/nodes-datasource';
import { LinksDataSource } from '../../cartography/datasources/links-datasource';
import { DrawingsDataSource } from '../../cartography/datasources/drawings-datasource';
import {
  MapNodesDataSource,
  MapLinksDataSource,
  MapDrawingsDataSource,
  MapSymbolsDataSource,
} from '../../cartography/datasources/map-datasource';
import { SettingsService, Settings } from '@services/settings.service';
import { ToolsService } from '@services/tools.service';
import { SelectionManager } from '../../cartography/managers/selection-manager';
import { SelectionTool } from '../../cartography/tools/selection-tool';
import { RecentlyOpenedProjectService } from '@services/recentlyOpenedProject.service';
import { MovingEventSource } from '../../cartography/events/moving-event-source';
import { MapScaleService } from '@services/mapScale.service';
import { NodeCreatedLabelStylesFixer } from './helpers/node-created-label-styles-fixer';
import { ToasterService } from '@services/toaster.service';
import { MapSettingsService } from '@services/mapsettings.service';
import { NotificationService } from '@services/notification.service';
import { NodeConsoleService } from '@services/nodeConsole.service';
import { SymbolService } from '@services/symbol.service';
import { ThemeService } from '@services/theme.service';
import { AiChatStore } from '../../stores/ai-chat.store';
import { Controller } from '@models/controller';
import { Project } from '@models/project';
import { Node } from '../../cartography/models/node';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('ProjectMapComponent', () => {
  let component: ProjectMapComponent;
  let fixture: ComponentFixture<ProjectMapComponent>;

  // Mock services
  let mockControllerService: any;
  let mockProjectService: any;
  let mockNodeService: any;
  let mockLinkService: any;
  let mockDrawingService: any;
  let mockProgressService: any;
  let mockProjectWebServiceHandler: any;
  let mockMapChangeDetectorRef: any;
  let mockNodeWidget: any;
  let mockDrawingsWidget: any;
  let mockLinkWidget: any;
  let mockLabelWidget: any;
  let mockInterfaceLabelWidget: any;
  let mockEthernetLinkWidget: any;
  let mockSerialLinkWidget: any;
  let mockMapNodeToNode: any;
  let mockMapDrawingToDrawing: any;
  let mockMapLabelToLabel: any;
  let mockMapLinkToLink: any;
  let mockMapLinkNodeToLinkNode: any;
  let mockNodesDataSource: any;
  let mockLinksDataSource: any;
  let mockDrawingsDataSource: any;
  let mockMapNodesDataSource: any;
  let mockMapLinksDataSource: any;
  let mockMapDrawingsDataSource: any;
  let mockMapSymbolsDataSource: any;
  let mockSettingsService: any;
  let mockToolsService: any;
  let mockSelectionManager: any;
  let mockSelectionTool: any;
  let mockRecentlyOpenedProjectService: any;
  let mockMovingEventSource: any;
  let mockMapScaleService: any;
  let mockNodeCreatedLabelStylesFixer: any;
  let mockToasterService: any;
  let mockMapSettingsService: any;
  let mockNotificationService: any;
  let mockNodeConsoleService: any;
  let mockSymbolService: any;
  let mockThemeService: any;
  let mockAiChatStore: any;
  let mockMatDialog: any;
  let mockMatBottomSheet: any;
  let mockRouter: any;
  let mockActivatedRoute: any;
  let mockTitle: any;
  let mockChangeDetectorRef: any;

  // Mock data
  let mockController: Controller;
  let mockProject: Project;

  beforeEach(async () => {
    mockController = {
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

    mockProject = {
      project_id: 'proj1',
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
    } as Project;

    // Create mock services
    mockControllerService = {
      isServiceInitialized: true,
      serviceInitialized: of(true),
      get: vi.fn().mockReturnValue(of(mockController)),
    };

    mockProjectService = {
      get: vi.fn().mockReturnValue(of(mockProject)),
      open: vi.fn().mockReturnValue(of(mockProject)),
      close: vi.fn().mockReturnValue(of(null)),
      delete: vi.fn().mockReturnValue(of(null)),
      nodes: vi.fn().mockReturnValue(of([])),
      links: vi.fn().mockReturnValue(of([])),
      drawings: vi.fn().mockReturnValue(of([])),
      update: vi.fn().mockReturnValue(of(mockProject)),
      isReadOnly: vi.fn().mockReturnValue(false),
    };

    mockNodeService = {
      createFromTemplate: vi.fn().mockReturnValue(of({})),
      delete: vi.fn().mockReturnValue(of({})),
      updateLabel: vi.fn().mockReturnValue(of({})),
      updateNode: vi.fn().mockReturnValue(of({})),
    };

    mockLinkService = {
      deleteLink: vi.fn().mockReturnValue(of(null)),
    };

    mockDrawingService = {
      delete: vi.fn().mockReturnValue(of({})),
      add: vi.fn().mockReturnValue(of({})),
    };

    mockProgressService = {
      activate: vi.fn(),
      deactivate: vi.fn(),
      setError: vi.fn(),
    };

    mockProjectWebServiceHandler = {
      errorNotificationEmitter: of({ type: 'error', message: 'Test error' }),
      warningNotificationEmitter: of({ type: 'warning', message: 'Test warning' }),
      handleMessage: vi.fn(),
    };

    mockMapChangeDetectorRef = {
      detectChanges: vi.fn(),
    };

    mockNodeWidget = {
      onContextMenu: of(null),
    };

    mockDrawingsWidget = {
      onContextMenu: of(null),
    };

    mockLinkWidget = {
      onContextMenu: of(null),
    };

    mockLabelWidget = {
      onContextMenu: of(null),
    };

    mockInterfaceLabelWidget = {
      onContextMenu: of(null),
    };

    mockEthernetLinkWidget = {
      onContextMenu: of(null),
    };

    mockSerialLinkWidget = {
      onContextMenu: of(null),
    };

    mockMapNodeToNode = {
      convert: vi.fn().mockImplementation((item) => ({} as Node)),
    };

    mockMapDrawingToDrawing = {
      convert: vi.fn().mockImplementation((item) => ({})),
    };

    mockMapLabelToLabel = {
      convert: vi.fn().mockImplementation((item) => ({ rotation: 0, style: '', text: '', x: 0, y: 0 })),
    };

    mockMapLinkToLink = {
      convert: vi.fn().mockImplementation((item) => ({ link_id: 'link1' })),
    };

    mockMapLinkNodeToLinkNode = {
      convert: vi.fn().mockImplementation((item) => ({})),
    };

    mockNodesDataSource = {
      changes: of([]),
      set: vi.fn(),
      getItems: vi.fn().mockReturnValue([]),
      clear: vi.fn(),
    };

    mockLinksDataSource = {
      changes: of([]),
      set: vi.fn(),
      getItems: vi.fn().mockReturnValue([]),
      clear: vi.fn(),
    };

    mockDrawingsDataSource = {
      changes: of([]),
      set: vi.fn(),
      getItems: vi.fn().mockReturnValue([]),
      clear: vi.fn(),
    };

    mockMapNodesDataSource = {
      getItems: vi.fn().mockReturnValue([]),
    };

    mockMapLinksDataSource = {
      getItems: vi.fn().mockReturnValue([]),
    };

    mockMapDrawingsDataSource = {
      getItems: vi.fn().mockReturnValue([]),
    };

    mockMapSymbolsDataSource = {
      getItems: vi.fn().mockReturnValue([]),
    };

    mockSettingsService = {
      getAll: vi.fn().mockReturnValue({} as Settings),
    };

    mockToolsService = {
      selectionToolActivation: vi.fn(),
      drawLinkToolActivation: vi.fn(),
    };

    mockSelectionManager = {
      setSelected: vi.fn(),
      getSelected: vi.fn().mockReturnValue([]),
    };

    mockSelectionTool = {
      contextMenuOpened: of(null),
    };

    mockRecentlyOpenedProjectService = {
      setcontrollerId: vi.fn(),
      setProjectId: vi.fn(),
    };

    mockMovingEventSource = {
      movingModeState: { emit: vi.fn() },
    };

    mockMapScaleService = {
      getScale: vi.fn().mockReturnValue(1),
      setScale: vi.fn(),
      resetToDefault: vi.fn(),
    };

    mockNodeCreatedLabelStylesFixer = {
      fix: vi.fn().mockImplementation((node) => node),
    };

    mockToasterService = {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
    };

    mockMapSettingsService = {
      getSymbolScaling: vi.fn().mockReturnValue(true),
      setSymbolScaling: vi.fn(),
      getAll: vi.fn().mockReturnValue({}),
      toggleSymbolScaling: vi.fn(),
      toggleShowInterfaceLabels: vi.fn(),
      toggleLogConsole: vi.fn(),
      toggleTopologySummary: vi.fn(),
      toggleLayers: vi.fn(),
      showInterfaceLabels: false,
      isLogConsoleVisible: true,
      isTopologySummaryVisible: true,
      logConsoleSubject: of(true),
      symbolScalingSubject: of(true),
      mapRenderedEmitter: { emit: vi.fn() },
    };

    mockNotificationService = {
      projectNotificationsPath: vi.fn().mockReturnValue('ws://localhost/notifications'),
      notificationsPath: vi.fn().mockReturnValue('ws://localhost/notifications'),
    };

    mockNodeConsoleService = {
      openConsoles: 0,
    };

    mockSymbolService = {
      getDimensions: vi.fn().mockReturnValue(of({ width: 50, height: 50 })),
      getMaximumSymbolSize: vi.fn().mockReturnValue(100),
      scaleDimensionsForNode: vi.fn().mockReturnValue({ width: 50, height: 50 }),
      getSymbolBlobUrl: vi.fn().mockReturnValue(of('blob:http://localhost/symbol')),
    };

    mockThemeService = {
      savedMapTheme: 'auto',
      isDarkMode: vi.fn().mockReturnValue(true),
    };

    mockAiChatStore = {
      getPanelStateValue: vi.fn().mockReturnValue({ isOpen: false, isMinimized: false, isMaximized: false }),
      openPanel: vi.fn(),
      restorePanel: vi.fn(),
      setPanelState: vi.fn(),
    };

    mockMatDialog = {
      open: vi.fn().mockReturnValue({
        afterClosed: vi.fn().mockReturnValue(of(false)),
        componentInstance: { onImportProject: of(null) },
      }),
    };

    mockMatBottomSheet = {
      open: vi.fn().mockReturnValue({
        afterDismissed: vi.fn().mockReturnValue(of(false)),
        instance: { projectMessage: '' },
      }),
    };

    mockRouter = {
      navigate: vi.fn(),
    };

    mockActivatedRoute = {
      paramMap: of({
        get: vi.fn().mockImplementation((key: string) => {
          if (key === 'controller_id') return '1';
          if (key === 'project_id') return 'proj1';
          return null;
        }),
        has: vi.fn().mockReturnValue(true),
        getAll: vi.fn().mockReturnValue([]),
        keys: [],
      } as unknown as ParamMap),
    };

    mockTitle = {
      setTitle: vi.fn(),
    };

    mockChangeDetectorRef = {
      markForCheck: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [CommonModule, RouterModule.forRoot([]), ProjectMapComponent],
      providers: [
        { provide: ControllerService, useValue: mockControllerService },
        { provide: ProjectService, useValue: mockProjectService },
        { provide: NodeService, useValue: mockNodeService },
        { provide: LinkService, useValue: mockLinkService },
        { provide: DrawingService, useValue: mockDrawingService },
        { provide: ProgressService, useValue: mockProgressService },
        { provide: ProjectWebServiceHandler, useValue: mockProjectWebServiceHandler },
        { provide: MapChangeDetectorRef, useValue: mockMapChangeDetectorRef },
        { provide: NodeWidget, useValue: mockNodeWidget },
        { provide: DrawingsWidget, useValue: mockDrawingsWidget },
        { provide: LinkWidget, useValue: mockLinkWidget },
        { provide: LabelWidget, useValue: mockLabelWidget },
        { provide: InterfaceLabelWidget, useValue: mockInterfaceLabelWidget },
        { provide: EthernetLinkWidget, useValue: mockEthernetLinkWidget },
        { provide: SerialLinkWidget, useValue: mockSerialLinkWidget },
        { provide: MapNodeToNodeConverter, useValue: mockMapNodeToNode },
        { provide: MapDrawingToDrawingConverter, useValue: mockMapDrawingToDrawing },
        { provide: MapLabelToLabelConverter, useValue: mockMapLabelToLabel },
        { provide: MapLinkToLinkConverter, useValue: mockMapLinkToLink },
        { provide: MapLinkNodeToLinkNodeConverter, useValue: mockMapLinkNodeToLinkNode },
        { provide: NodesDataSource, useValue: mockNodesDataSource },
        { provide: LinksDataSource, useValue: mockLinksDataSource },
        { provide: DrawingsDataSource, useValue: mockDrawingsDataSource },
        { provide: MapNodesDataSource, useValue: mockMapNodesDataSource },
        { provide: MapLinksDataSource, useValue: mockMapLinksDataSource },
        { provide: MapDrawingsDataSource, useValue: mockMapDrawingsDataSource },
        { provide: MapSymbolsDataSource, useValue: mockMapSymbolsDataSource },
        { provide: SettingsService, useValue: mockSettingsService },
        { provide: ToolsService, useValue: mockToolsService },
        { provide: SelectionManager, useValue: mockSelectionManager },
        { provide: SelectionTool, useValue: mockSelectionTool },
        { provide: RecentlyOpenedProjectService, useValue: mockRecentlyOpenedProjectService },
        { provide: MovingEventSource, useValue: mockMovingEventSource },
        { provide: MapScaleService, useValue: mockMapScaleService },
        { provide: NodeCreatedLabelStylesFixer, useValue: mockNodeCreatedLabelStylesFixer },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: MapSettingsService, useValue: mockMapSettingsService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: NodeConsoleService, useValue: mockNodeConsoleService },
        { provide: SymbolService, useValue: mockSymbolService },
        { provide: ThemeService, useValue: mockThemeService },
        { provide: AiChatStore, useValue: mockAiChatStore },
        { provide: MatDialog, useValue: mockMatDialog },
        { provide: MatBottomSheet, useValue: mockMatBottomSheet },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Title, useValue: mockTitle },
        { provide: ChangeDetectorRef, useValue: mockChangeDetectorRef },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectMapComponent);
    component = fixture.componentInstance;

    // Mock lazyLoadTopologySummary to avoid ViewContainerRef issues in tests
    vi.spyOn(component, 'lazyLoadTopologySummary').mockImplementation(() => Promise.resolve());
  });

  afterEach(() => {
    fixture.destroy();
    vi.clearAllMocks();
  });

  describe('Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should have default initial values', () => {
      expect(component.isProjectMapMenuVisible).toBe(false);
      expect(component.isConsoleVisible).toBe(true);
      expect(component.isTopologySummaryVisible).toBe(true);
      expect(component.isInterfaceLabelVisible).toBe(false);
      expect(component.notificationsVisibility).toBe(false);
      expect(component.layersVisibility).toBe(false);
      expect(component.gridVisibility).toBe(false);
      expect(component.toolbarVisibility).toBe(true);
      expect(component.symbolScaling).toBe(true);
      expect(component.isAIChatVisible).toBe(false);
    });
  });

  describe('Toggle Moving Mode', () => {
    it('should toggle moving mode on', () => {
      component.tools.moving = false;

      component.toggleMovingMode();

      expect(component.tools.moving).toBe(true);
      expect(mockMovingEventSource.movingModeState.emit).toHaveBeenCalledWith(true);
    });

    it('should toggle moving mode off', () => {
      component.tools.moving = true;

      component.toggleMovingMode();

      expect(component.tools.moving).toBe(false);
      expect(mockMovingEventSource.movingModeState.emit).toHaveBeenCalledWith(false);
    });

    it('should disable selection when moving mode is enabled', () => {
      component.tools.moving = false;
      component.tools.selection = true;

      component.toggleMovingMode();

      expect(component.tools.selection).toBe(false);
      expect(mockToolsService.selectionToolActivation).toHaveBeenCalledWith(false);
    });
  });

  describe('Toggle Draw Line Mode', () => {
    it('should toggle draw link mode on', () => {
      component.tools.draw_link = false;

      component.toggleDrawLineMode();

      expect(component.tools.draw_link).toBe(true);
      expect(mockToolsService.drawLinkToolActivation).toHaveBeenCalledWith(true);
    });

    it('should toggle draw link mode off', () => {
      component.tools.draw_link = true;

      component.toggleDrawLineMode();

      expect(component.tools.draw_link).toBe(false);
      expect(mockToolsService.drawLinkToolActivation).toHaveBeenCalledWith(false);
    });
  });

  describe('Toggle Show Interface Labels', () => {
    it('should toggle interface labels visibility', () => {
      component.isInterfaceLabelVisible = false;

      component.toggleShowInterfaceLabels(true);

      expect(component.isInterfaceLabelVisible).toBe(true);
      expect(mockMapSettingsService.toggleShowInterfaceLabels).toHaveBeenCalledWith(true);
    });
  });

  describe('Toggle Show Console', () => {
    it('should toggle console visibility', () => {
      component.isConsoleVisible = false;

      component.toggleShowConsole(true);

      expect(component.isConsoleVisible).toBe(true);
      expect(mockMapSettingsService.toggleLogConsole).toHaveBeenCalledWith(true);
    });
  });

  describe('Toggle Notifications', () => {
    it('should enable notifications and save to localStorage', () => {
      component.notificationsVisibility = false;

      component.toggleNotifications(true);

      expect(component.notificationsVisibility).toBe(true);
      expect(localStorage.getItem('notificationsVisibility')).toBe('true');
    });

    it('should disable notifications and remove from localStorage', () => {
      component.notificationsVisibility = true;

      component.toggleNotifications(false);

      expect(component.notificationsVisibility).toBe(false);
      expect(localStorage.getItem('notificationsVisibility')).toBeNull();
    });
  });

  describe('Toggle Symbol Scaling', () => {
    it('should toggle symbol scaling', () => {
      component.symbolScaling = true;

      component.toggleSymbolScaling(false);

      expect(component.symbolScaling).toBe(false);
      expect(mockMapSettingsService.setSymbolScaling).toHaveBeenCalledWith(false);
    });
  });

  describe('Zoom Methods', () => {
    describe('zoomIn', () => {
      it('should increase scale by 0.1', () => {
        mockMapScaleService.getScale.mockReturnValue(1);

        component.zoomIn();

        expect(mockMapScaleService.setScale).toHaveBeenCalledWith(1.1);
      });
    });

    describe('zoomOut', () => {
      it('should decrease scale by 0.1 when greater than 0.1', () => {
        mockMapScaleService.getScale.mockReturnValue(1);

        component.zoomOut();

        expect(mockMapScaleService.setScale).toHaveBeenCalledWith(0.9);
      });

      it('should not decrease scale below 0.1', () => {
        mockMapScaleService.getScale.mockReturnValue(0.05);

        component.zoomOut();

        expect(mockMapScaleService.setScale).not.toHaveBeenCalled();
      });
    });

    describe('resetZoom', () => {
      it('should reset scale to default', () => {
        component.resetZoom();

        expect(mockMapScaleService.resetToDefault).toHaveBeenCalled();
      });
    });
  });

  describe('Menu Visibility', () => {
    describe('showMenu', () => {
      it('should show project map menu', () => {
        component.isProjectMapMenuVisible = false;

        component.showMenu();

        expect(component.isProjectMapMenuVisible).toBe(true);
      });
    });
  });

  describe('AI Chat Methods', () => {
    describe('onAIChatOpened', () => {
      it('should open AI chat panel', () => {
        component.isAIChatVisible = false;
        mockAiChatStore.getPanelStateValue.mockReturnValue({ isOpen: false, isMinimized: false, isMaximized: false });

        component.onAIChatOpened();

        expect(mockAiChatStore.openPanel).toHaveBeenCalled();
        expect(component.isAIChatVisible).toBe(true);
      });

      it('should restore minimized panel', () => {
        component.isAIChatVisible = true;
        mockAiChatStore.getPanelStateValue.mockReturnValue({ isOpen: true, isMinimized: true, isMaximized: false });

        component.onAIChatOpened();

        expect(mockAiChatStore.restorePanel).toHaveBeenCalled();
      });
    });

    describe('closeAIChat', () => {
      it('should close AI chat', () => {
        component.isAIChatVisible = true;

        component.closeAIChat();

        expect(component.isAIChatVisible).toBe(false);
      });
    });

    describe('onLeaveProject', () => {
      it('should close AI chat and reset panel state', () => {
        component.isAIChatVisible = true;

        component.onLeaveProject();

        expect(component.isAIChatVisible).toBe(false);
        expect(mockAiChatStore.setPanelState).toHaveBeenCalledWith({
          isOpen: false,
          isMinimized: false,
          isMaximized: false,
        });
      });
    });
  });

  describe('readonly Property', () => {
    it('should set inReadOnlyMode and disable selection tool when readonly is true', () => {
      component.readonly = true;

      expect(component.readonly).toBe(true);
      expect(component.tools.selection).toBe(false);
      expect(mockToolsService.selectionToolActivation).toHaveBeenCalledWith(false);
    });

    it('should set inReadOnlyMode and enable selection tool when readonly is false', () => {
      component.readonly = true;

      component.readonly = false;

      expect(component.readonly).toBe(false);
      expect(component.tools.selection).toBe(true);
      expect(mockToolsService.selectionToolActivation).toHaveBeenCalledWith(true);
    });
  });

  describe('mapBgClass', () => {
    it('should return a computed object for auto theme', () => {
      const result = component.mapBgClass();

      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    it('should return a computed object for dark theme', () => {
      mockThemeService.savedMapTheme = 'dark-default';

      const result = component.mapBgClass();

      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    it('should return a computed object for light theme', () => {
      mockThemeService.savedMapTheme = 'light-default';

      const result = component.mapBgClass();

      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });
  });

  describe('Export Project', () => {
    it('should show error when project has VirtualBox machines', () => {
      const vboxNode = {
        node_id: 'node1',
        name: 'VBox',
        status: 'started',
        node_type: 'virtualbox',
        console_host: '',
        project_id: '',
        command_line: '',
        compute_id: '',
        height: 0,
        width: 0,
        x: 0,
        y: 0,
        z: 0,
        port_name_format: '',
        port_segment_size: 0,
        first_port_name: '',
        label: undefined,
        symbol: '',
        symbol_url: '',
        console: 0,
        console_auto_start: false,
        console_type: '',
        locked: false,
        node_directory: '',
        ports: [],
        properties: {},
      } as unknown as Node;
      component.nodes = signal<Node[]>([vboxNode]);

      component.exportProject();

      expect(mockToasterService.error).toHaveBeenCalledWith('Map with VirtualBox machines cannot be exported.');
    });

    it('should show error when project has running VPCS nodes', () => {
      const vpcsNode = {
        node_id: 'node1',
        name: 'VPCS',
        status: 'started',
        node_type: 'vpcs',
        console_host: '',
        project_id: '',
        command_line: '',
        compute_id: '',
        height: 0,
        width: 0,
        x: 0,
        y: 0,
        z: 0,
        port_name_format: '',
        port_segment_size: 0,
        first_port_name: '',
        label: undefined,
        symbol: '',
        symbol_url: '',
        console: 0,
        console_auto_start: false,
        console_type: '',
        locked: false,
        node_directory: '',
        ports: [],
        properties: {},
      } as unknown as Node;
      component.nodes = signal<Node[]>([vpcsNode]);

      component.exportProject();

      expect(mockToasterService.error).toHaveBeenCalledWith('Project with running nodes cannot be exported.');
    });
  });

  describe('ngOnDestroy', () => {
    it('should call onLeaveProject', () => {
      const onLeaveProjectSpy = vi.spyOn(component, 'onLeaveProject');

      component.ngOnDestroy();

      expect(onLeaveProjectSpy).toHaveBeenCalled();
    });

    it('should reset node console open count', () => {
      component.ngOnDestroy();

      expect(mockNodeConsoleService.openConsoles).toBe(0);
    });

    it('should reset title', () => {
      component.ngOnDestroy();

      expect(mockTitle.setTitle).toHaveBeenCalledWith('GNS3 Web UI');
    });

    it('should clear all data sources', () => {
      component.ngOnDestroy();

      expect(mockDrawingsDataSource.clear).toHaveBeenCalled();
      expect(mockNodesDataSource.clear).toHaveBeenCalled();
      expect(mockLinksDataSource.clear).toHaveBeenCalled();
    });
  });
});

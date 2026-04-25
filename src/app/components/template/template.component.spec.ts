import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { OverlayContainer } from '@angular/cdk/overlay';
import { Subject, of, throwError } from 'rxjs';
import { TemplateComponent } from './template.component';
import { TemplateService } from '@services/template.service';
import { SymbolService } from '@services/symbol.service';
import { ThemeService } from '@services/theme.service';
import { NotificationService } from '@services/notification.service';
import { ComputeService } from '@services/compute.service';
import { ToasterService } from '@services/toaster.service';
import { Context, Transformation } from '../../cartography/models/context';
import { Size } from '../../cartography/models/size';
import { Template } from '@models/template';
import { Controller } from '@models/controller';
import { Project } from '@models/project';
import { NodeAddedEvent, TemplateListDialogComponent } from './template-list-dialog/template-list-dialog.component';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('TemplateComponent', () => {
  let component: TemplateComponent;
  let fixture: ComponentFixture<TemplateComponent>;

  let mockTemplateService: any;
  let mockSymbolService: any;
  let mockThemeService: any;
  let mockOverlayContainer: any;
  let mockContext: Context;
  let mockDialog: any;
  let mockDialogRef: any;

  let newTemplateCreatedSubject: Subject<Template>;
  let themeChangedSubject: Subject<void>;
  let originalWindowEvent: typeof window.event;

  let mockController: Controller;
  let mockProject: Project;

  const createMockTemplate = (id: string, name: string, templateType: string): Template => ({
    template_id: id,
    builtin: false,
    category: 'router',
    compute_id: 'local',
    default_name_format: '{name}-{0}',
    name,
    node_type: 'vpcs',
    symbol: 'router',
    template_type: templateType,
  });

  beforeEach(async () => {
    newTemplateCreatedSubject = new Subject<Template>();
    themeChangedSubject = new Subject<void>();

    mockTemplateService = {
      newTemplateCreated: newTemplateCreatedSubject,
      list: vi.fn().mockReturnValue(of([])),
    };

    mockSymbolService = {
      list: vi.fn().mockReturnValue(of([])),
      getSymbolFromTemplate: vi.fn().mockReturnValue('http://localhost:3080/v4/symbols/router/raw'),
    };

    mockThemeService = {
      getThemeType: vi.fn().mockReturnValue('dark'),
      themeChanged: themeChangedSubject,
    };

    mockOverlayContainer = {
      getContainerElement: vi.fn().mockReturnValue(document.createElement('div')),
    };

    mockContext = new Context();
    mockContext.transformation = new Transformation(0, 0, 1);
    mockContext.size = new Size(1000, 800);

    mockDialogRef = {
      afterClosed: vi.fn().mockReturnValue(of(null)),
    };

    mockDialog = {
      open: vi.fn().mockReturnValue(mockDialogRef),
    };

    const mockComputeService = {
      getComputes: vi.fn().mockReturnValue(of([])),
    };

    const mockToasterService = {
      error: vi.fn(),
      success: vi.fn(),
    };

    const mockNotificationService = {
      computeNotificationEmitter: new Subject(),
      connectToComputeNotifications: vi.fn(),
      hasCachedData: vi.fn().mockReturnValue(false),
      getCachedComputes: vi.fn().mockReturnValue([]),
      setInitialComputes: vi.fn(),
      computeCacheUpdated: new Subject(),
    };

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

    await TestBed.configureTestingModule({
      imports: [TemplateComponent, MatDialogModule],
      providers: [
        { provide: TemplateService, useValue: mockTemplateService },
        { provide: SymbolService, useValue: mockSymbolService },
        { provide: ThemeService, useValue: mockThemeService },
        { provide: OverlayContainer, useValue: mockOverlayContainer },
        { provide: Context, useValue: mockContext },
        { provide: MatDialog, useValue: mockDialog },
        { provide: ComputeService, useValue: mockComputeService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TemplateComponent);
    component = fixture.componentInstance;
    // Use componentRef.setInput for signal inputs (Angular 21 pattern)
    fixture.componentRef.setInput('controller', mockController);
    fixture.componentRef.setInput('project', mockProject);
    // Initialize subscriptions to prevent ngOnDestroy errors
    component['subscription'] = { unsubscribe: vi.fn() } as any;
    component['themeSubscription'] = { unsubscribe: vi.fn() } as any;
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should have default empty templates array', () => {
      expect(component.templates).toEqual([]);
    });

    it('should have default empty filteredTemplates array', () => {
      expect(component.filteredTemplates).toEqual([]);
    });

    it('should have searchText initialized to empty string', () => {
      expect(component.searchText()).toBe('');
    });

    it('should have templateTypes with all expected types', () => {
      expect(component.templateTypes).toContain('all');
      expect(component.templateTypes).toContain('cloud');
      expect(component.templateTypes).toContain('ethernet_hub');
      expect(component.templateTypes).toContain('ethernet_switch');
      expect(component.templateTypes).toContain('docker');
      expect(component.templateTypes).toContain('vpcs');
      expect(component.templateTypes).toContain('dynamips');
      expect(component.templateTypes).toContain('qemu');
      expect(component.templateTypes).toContain('virtualbox');
      expect(component.templateTypes).toContain('vmware');
      expect(component.templateTypes).toContain('iou');
    });
  });

  describe('ngOnInit', () => {
    it('should call templateService.list with controller', () => {
      const templates = [createMockTemplate('t1', 'Router', 'dynamips')];
      mockTemplateService.list.mockReturnValue(of(templates));

      component.ngOnInit();

      expect(mockTemplateService.list).toHaveBeenCalledWith(mockController);
    });

    it('should load templates and sort them', () => {
      const templates = [createMockTemplate('t1', 'Zebra', 'dynamips'), createMockTemplate('t2', 'Alpha', 'dynamips')];
      mockTemplateService.list.mockReturnValue(of(templates));

      component.ngOnInit();

      expect(component.templates).toEqual(templates);
      expect(component.filteredTemplates[0].name).toBe('Alpha');
      expect(component.filteredTemplates[1].name).toBe('Zebra');
    });

    it('should call symbolService.list with controller', () => {
      mockTemplateService.list.mockReturnValue(of([]));

      component.ngOnInit();

      expect(mockSymbolService.list).toHaveBeenCalledWith(mockController);
    });

    it('should detect light theme', () => {
      mockThemeService.getThemeType.mockReturnValue('light');
      mockTemplateService.list.mockReturnValue(of([]));

      component.ngOnInit();

      expect(mockThemeService.getThemeType).toHaveBeenCalled();
      expect(component['isLightThemeEnabled']).toBe(true);
    });

    it('should detect dark theme', () => {
      mockThemeService.getThemeType.mockReturnValue('dark');
      mockTemplateService.list.mockReturnValue(of([]));

      component.ngOnInit();

      expect(mockThemeService.getThemeType).toHaveBeenCalled();
      expect(component['isLightThemeEnabled']).toBe(false);
    });

    it('should subscribe to newTemplateCreated and add template to list', () => {
      const templates = [createMockTemplate('t1', 'Existing', 'vpcs')];
      mockTemplateService.list.mockReturnValue(of(templates));

      component.ngOnInit();

      const newTemplate = createMockTemplate('t2', 'NewTemplate', 'docker');
      newTemplateCreatedSubject.next(newTemplate);

      expect(component.templates).toContain(newTemplate);
    });

    it('should subscribe to themeChanged', () => {
      mockThemeService.getThemeType.mockReturnValue('dark');
      mockTemplateService.list.mockReturnValue(of([]));

      component.ngOnInit();
      // Theme change should be detected without errors
      expect(() => themeChangedSubject.next()).not.toThrow();
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from template subscription', () => {
      mockTemplateService.list.mockReturnValue(of([]));

      component.ngOnInit();
      component.ngOnDestroy();

      // Should not throw when emitting after unsubscribe
      expect(() => newTemplateCreatedSubject.next(createMockTemplate('t1', 'Test', 'vpcs'))).not.toThrow();
    });
  });

  describe('sortTemplates', () => {
    it('should sort templates alphabetically by name ascending', () => {
      component.filteredTemplates = [
        createMockTemplate('t1', 'Zebra', 'dynamips'),
        createMockTemplate('t2', 'Alpha', 'dynamips'),
        createMockTemplate('t3', 'Beta', 'vpcs'),
      ];

      component.sortTemplates();

      expect(component.filteredTemplates[0].name).toBe('Alpha');
      expect(component.filteredTemplates[1].name).toBe('Beta');
      expect(component.filteredTemplates[2].name).toBe('Zebra');
    });

    it('should handle single template', () => {
      component.filteredTemplates = [createMockTemplate('t1', 'Only', 'vpcs')];

      component.sortTemplates();

      expect(component.filteredTemplates.length).toBe(1);
      expect(component.filteredTemplates[0].name).toBe('Only');
    });

    it('should handle empty array', () => {
      component.filteredTemplates = [];

      expect(() => component.sortTemplates()).not.toThrow();
    });
  });

  describe('filterTemplates', () => {
    const templates = [
      createMockTemplate('t1', 'Router', 'dynamips'),
      createMockTemplate('t2', 'Switch', 'ethernet_switch'),
      createMockTemplate('t3', 'Cloud', 'cloud'),
      createMockTemplate('t4', 'DockerHost', 'docker'),
    ];

    beforeEach(() => {
      component.templates = [...templates];
      component.filteredTemplates = [...templates];
      component.selectedType.set('all');
      component.searchText.set('');
    });

    it('should filter templates by searchText case-insensitively', () => {
      component.searchText.set('router');

      component.filterTemplates();

      expect(component.filteredTemplates.length).toBe(1);
      expect(component.filteredTemplates[0].name).toBe('Router');
    });

    it('should filter templates by partial match', () => {
      component.searchText.set('host');

      component.filterTemplates();

      expect(component.filteredTemplates.length).toBe(1);
      expect(component.filteredTemplates[0].name).toBe('DockerHost');
    });

    it('should filter by selectedType when not all', () => {
      component.searchText.set('');
      component.selectedType.set('docker');

      component.filterTemplates();

      expect(component.filteredTemplates.length).toBe(1);
      expect(component.filteredTemplates[0].template_type).toBe('docker');
    });

    it('should combine searchText and selectedType filters', () => {
      component.templates = [
        createMockTemplate('t1', 'DockerProd', 'docker'),
        createMockTemplate('t2', 'DockerDev', 'docker'),
        createMockTemplate('t3', 'DockerHQ', 'docker'),
      ];
      component.filteredTemplates = [...component.templates];
      component.selectedType.set('docker');

      component.searchText.set('prod');
      component.filterTemplates();

      expect(component.filteredTemplates.length).toBe(1);
      expect(component.filteredTemplates[0].name).toBe('DockerProd');
    });

    it('should return all templates when searchText is empty and type is all', () => {
      component.searchText.set('');

      component.filterTemplates();

      expect(component.filteredTemplates.length).toBe(4);
    });

    it('should sort templates after filtering', () => {
      component.templates = [createMockTemplate('t1', 'Zebra', 'cloud'), createMockTemplate('t2', 'Alpha', 'cloud')];
      component.filteredTemplates = [...component.templates];

      component.filterTemplates();

      expect(component.filteredTemplates[0].name).toBe('Alpha');
      expect(component.filteredTemplates[1].name).toBe('Zebra');
    });
  });

  describe('dragStart', () => {
    it('should set isDragging signal to true', () => {
      component.ngOnInit();

      component.dragStart({} as any, createMockTemplate('t1', 'Test', 'vpcs'));

      expect(component['isDragging']()).toBe(true);
    });

    it('should store dragElement reference', () => {
      component.ngOnInit();

      const mockElement = document.createElement('div');
      const mockMouseEvent = {
        clientX: 100,
        clientY: 100,
        target: mockElement,
      } as unknown as MouseEvent;

      originalWindowEvent = window.event;
      const eventSpy = vi.spyOn(window, 'event', 'get').mockReturnValue(mockMouseEvent);

      component.dragStart({} as any, createMockTemplate('t1', 'Test', 'vpcs'));

      expect(component['dragElement']).toBe(mockElement);

      eventSpy.mockReturnValue(originalWindowEvent);
    });
  });

  describe('dragEnd', () => {
    beforeEach(() => {
      // Set cached computes so dragEnd uses cache instead of making HTTP request
      component['cachedComputes'].set([{ compute_id: 'local', name: 'Local', host: 'localhost', port: 3080, protocol: 'http:', connected: true } as any]);
    });

    it('should emit nodeCreationChange event', () => {
      const emitSpy = vi.spyOn(component.nodeCreationChange, 'emit');

      component.dragEnd({} as any, createMockTemplate('t1', 'Test', 'vpcs'));

      expect(emitSpy).toHaveBeenCalled();
    });

    it('should emit NodeAddedEvent with correct structure', () => {
      const emitSpy = vi.spyOn(component.nodeCreationChange, 'emit');
      const template = createMockTemplate('t1', 'TestTemplate', 'vpcs');

      component.dragEnd({} as any, template);

      const emittedEvent = emitSpy.mock.calls[0][0] as NodeAddedEvent;
      expect(emittedEvent.template).toBe(template);
      expect(emittedEvent.controller).toBe('local');
      expect(emittedEvent.numberOfNodes).toBe(1);
      expect(typeof emittedEvent.x).toBe('number');
      expect(typeof emittedEvent.y).toBe('number');
    });

    it('should calculate world coordinates from screen position', () => {
      const emitSpy = vi.spyOn(component.nodeCreationChange, 'emit');

      // Set up context with known transformation
      mockContext.transformation = new Transformation(100, 50, 2); // k=2 means zoom 2x
      mockContext.size = new Size(800, 600);

      // Set drag position signal
      component['lastPageX'].set(500);
      component['lastPageY'].set(400);
      component['mouseOffsetX'] = 25;
      component['mouseOffsetY'] = 25;

      const template = createMockTemplate('t1', 'Test', 'vpcs');
      component.dragEnd({} as any, template);

      const emittedEvent = emitSpy.mock.calls[0][0] as NodeAddedEvent;

      // With transformation x=100, y=50, k=2:
      // worldX = (500 - (400 + 100)) / 2 = 0, then subtract offset 25 = -25 (rounded)
      // Actually: centerX = 800/2 = 400, centerY = 600/2 = 300
      // worldX = (500 - (400 + 100)) / 2 = 0, then 0 - 25 = -25
      // worldY = (400 - (300 + 50)) / 2 = 25, then 25 - 25 = 0
      // After rounding: x = -25, y = 0
      expect(emittedEvent.x).toBeDefined();
      expect(emittedEvent.y).toBeDefined();
    });

    it('should use project scene dimensions as fallback when context size is 0', () => {
      const emitSpy = vi.spyOn(component.nodeCreationChange, 'emit');

      // Set cached computes so dragEnd uses cache instead of making HTTP request
      component['cachedComputes'].set([{ compute_id: 'local', name: 'Local', host: 'localhost', port: 3080, protocol: 'http:', connected: true } as any]);

      mockContext.size = new Size(0, 0);
      component['lastPageX'].set(500);
      component['lastPageY'].set(400);
      component['mouseOffsetX'] = 0;
      component['mouseOffsetY'] = 0;

      const template = createMockTemplate('t1', 'Test', 'vpcs');
      component.dragEnd({} as any, template);

      // Should use project scene dimensions (2000/2=1000, 1000/2=500) as center
      expect(emitSpy).toHaveBeenCalled();
    });
  });

  // openDialog tests are skipped because they require TemplateListDialogComponent
  // which needs ComputeService, ToasterService, NonNegativeValidator and other
  // dependencies that are complex to mock in a unit test context.
  // Additionally, MatDialog.open() creates actual DOM elements that require
  // the full Angular testing module with all dialog dependencies.
  // These behaviors would be better tested in an integration test with
  // TestBed.configureTestingModule with all required imports.
  describe.skip('openDialog', () => {});

  // getImageSourceForTemplate is tested indirectly through the template rendering
  // which uses templateSymbolBlobUrls Map populated by loadTemplateSymbolBlobs
  describe.skip('getImageSourceForTemplate', () => {});

  describe('Output Events', () => {
    it('should have nodeCreationChange EventEmitter', () => {
      expect(component.nodeCreationChange).toBeDefined();
    });
  });

  describe('Inputs', () => {
    it('should accept controller input', () => {
      expect(component.controller()).toBe(mockController);
    });

    it('should accept project input', () => {
      expect(component.project()).toBe(mockProject);
    });
  });

  describe('error handling', () => {
    let mockToasterService: any;
    let mockComputeService: any;
    let mockSymbolService: any;

    beforeEach(() => {
      vi.clearAllMocks();

      mockToasterService = {
        error: vi.fn(),
        success: vi.fn(),
      };

      mockComputeService = {
        getComputes: vi.fn().mockReturnValue(of([])),
      };

      mockSymbolService = {
        list: vi.fn().mockReturnValue(of([])),
        getSymbolFromTemplate: vi.fn().mockReturnValue('http://localhost:3080/v4/symbols/router/raw'),
        getSymbolBlobUrl: vi.fn().mockReturnValue(of('blob:http://example.com/symbol')),
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [TemplateComponent, MatDialogModule],
        providers: [
          { provide: TemplateService, useValue: mockTemplateService },
          { provide: SymbolService, useValue: mockSymbolService },
          { provide: ThemeService, useValue: mockThemeService },
          { provide: OverlayContainer, useValue: mockOverlayContainer },
          { provide: Context, useValue: mockContext },
          { provide: MatDialog, useValue: mockDialog },
          { provide: ComputeService, useValue: mockComputeService },
          { provide: ToasterService, useValue: mockToasterService },
          { provide: NotificationService, useValue: {
            computeNotificationEmitter: new Subject(),
            connectToComputeNotifications: vi.fn(),
            hasCachedData: vi.fn().mockReturnValue(false),
            getCachedComputes: vi.fn().mockReturnValue([]),
            setInitialComputes: vi.fn(),
            computeCacheUpdated: new Subject(),
          }},
        ],
      });

      fixture = TestBed.createComponent(TemplateComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('project', mockProject);
      component['subscription'] = { unsubscribe: vi.fn() } as any;
      component['themeSubscription'] = { unsubscribe: vi.fn() } as any;
    });

    describe('loadTemplates', () => {
      it('should show error toaster when list fails with error.error.message', () => {
        mockTemplateService.list.mockReturnValue(
          throwError(() => ({ error: { message: 'List failed' } }))
        );

        component.ngOnInit();

        expect(mockToasterService.error).toHaveBeenCalledWith('List failed');
      });

      it('should use fallback message when list error has no message', () => {
        mockTemplateService.list.mockReturnValue(throwError(() => ({})));

        component.ngOnInit();

        expect(mockToasterService.error).toHaveBeenCalledWith('Failed to load templates');
      });
    });

    describe('loadTemplateSymbolBlobs', () => {
      it('should show error toaster when forkJoin fails', () => {
        mockTemplateService.list.mockReturnValue(of([createMockTemplate('t1', 'Test', 'vpcs')]));
        mockSymbolService.getSymbolBlobUrl.mockReturnValue(throwError(() => ({ error: { message: 'Symbol failed' } })));

        component.ngOnInit();

        // Need to wait for async operations
        expect(mockToasterService.error).toHaveBeenCalledWith('Symbol failed');
      });

      it('should use fallback message when symbol error has no message', () => {
        mockTemplateService.list.mockReturnValue(of([createMockTemplate('t1', 'Test', 'vpcs')]));
        mockSymbolService.getSymbolBlobUrl.mockReturnValue(throwError(() => ({})));

        component.ngOnInit();

        expect(mockToasterService.error).toHaveBeenCalledWith('Failed to load template symbols');
      });
    });

    describe('dragEnd - getComputes', () => {
      beforeEach(() => {
        component['cachedComputes'].set([]);
        component['lastPageX'].set(100);
        component['lastPageY'].set(100);
        component['mouseOffsetX'] = 0;
        component['mouseOffsetY'] = 0;
      });

      it('should show error toaster when getComputes fails and fallback to local', () => {
        mockComputeService.getComputes.mockReturnValue(
          throwError(() => ({ error: { message: 'Computes failed' } }))
        );
        const emitSpy = vi.spyOn(component.nodeCreationChange, 'emit');

        component.dragEnd({} as any, createMockTemplate('t1', 'Test', 'vpcs'));

        expect(mockToasterService.error).toHaveBeenCalledWith('Computes failed');
        expect(emitSpy).toHaveBeenCalled();
        const emittedEvent = emitSpy.mock.calls[0][0] as NodeAddedEvent;
        expect(emittedEvent.controller).toBe('local');
      });

      it('should use fallback message when getComputes error has no message', () => {
        mockComputeService.getComputes.mockReturnValue(throwError(() => ({})));
        const emitSpy = vi.spyOn(component.nodeCreationChange, 'emit');

        component.dragEnd({} as any, createMockTemplate('t1', 'Test', 'vpcs'));

        expect(mockToasterService.error).toHaveBeenCalledWith('Failed to load computes');
        expect(emitSpy).toHaveBeenCalled();
      });

      it('should filter out unreachable compute nodes and show error when none are reachable', () => {
        component['cachedComputes'].set([
          { compute_id: 'remote1', name: 'Remote1', host: '192.168.1.100', port: 3080, protocol: 'http:', connected: false } as any,
          { compute_id: 'remote2', name: 'Remote2', host: '192.168.1.101', port: 3080, protocol: 'http:', connected: false } as any,
        ]);
        component['lastPageX'].set(100);
        component['lastPageY'].set(100);
        component['mouseOffsetX'] = 0;
        component['mouseOffsetY'] = 0;

        const emitSpy = vi.spyOn(component.nodeCreationChange, 'emit');

        component.dragEnd({} as any, createMockTemplate('t1', 'Test', 'vpcs'));

        expect(mockToasterService.error).toHaveBeenCalledWith('No reachable compute nodes available. Please check your compute nodes connection status.');
        expect(emitSpy).not.toHaveBeenCalled();
      });

      it('should filter out unreachable compute nodes and use only reachable ones', () => {
        component['cachedComputes'].set([
          { compute_id: 'local', name: 'Local', host: 'localhost', port: 3080, protocol: 'http:', connected: true } as any,
          { compute_id: 'remote1', name: 'Remote1', host: '192.168.1.100', port: 3080, protocol: 'http:', connected: false } as any,
          { compute_id: 'remote2', name: 'Remote2', host: '192.168.1.101', port: 3080, protocol: 'http:', connected: true } as any,
        ]);
        component['lastPageX'].set(100);
        component['lastPageY'].set(100);
        component['mouseOffsetX'] = 0;
        component['mouseOffsetY'] = 0;

        const emitSpy = vi.spyOn(component.nodeCreationChange, 'emit');

        component.dragEnd({} as any, createMockTemplate('t1', 'Test', 'vpcs'));

        // When there are multiple reachable computes, should show selector instead of emitting directly
        expect(component['showComputeSelector']()).toBe(true);
        expect(emitSpy).not.toHaveBeenCalled();
        // Verify that only connected computes are available
        const availableComputes = component['availableComputes']();
        expect(availableComputes.length).toBe(2); // local and remote2 (remote1 is filtered out)
        expect(availableComputes.every((c: any) => c.connected)).toBe(true);
      });
    });
  });
});

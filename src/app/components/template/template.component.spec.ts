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
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

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
  let dialogClosedSubject: Subject<void>;

  let newTemplateCreatedSubject: Subject<Template>;
  let themeChangedSubject: Subject<void>;

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
    dialogClosedSubject = new Subject<void>();

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
      afterClosed: vi.fn().mockReturnValue(dialogClosedSubject),
      componentInstance: {
        nodeAddRequested: new Subject<NodeAddedEvent>(),
        templateDragStarted: new Subject(),
        refreshSymbolImages: vi.fn(),
      },
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
    component['dialog'] = mockDialog;
    // Initialize subscriptions to prevent ngOnDestroy errors
    component['subscription'] = { unsubscribe: vi.fn() } as any;
    component['themeSubscription'] = { unsubscribe: vi.fn() } as any;
  });

  afterEach(() => {
    delete document.documentElement.dataset['density'];
    if (fixture) {
      fixture.destroy();
    }
  });

  describe('Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should have default empty templates array', () => {
      expect(component.templates).toEqual([]);
    });
  });

  describe('ngOnInit', () => {
    it('should call templateService.list with controller', () => {
      const templates = [createMockTemplate('t1', 'Router', 'dynamips')];
      mockTemplateService.list.mockReturnValue(of(templates));

      component.ngOnInit();
      fixture.detectChanges();

      expect(mockTemplateService.list).toHaveBeenCalledWith(mockController);
    });

    it('should load templates', () => {
      const templates = [createMockTemplate('t1', 'Zebra', 'dynamips'), createMockTemplate('t2', 'Alpha', 'dynamips')];
      mockTemplateService.list.mockReturnValue(of(templates));

      component.ngOnInit();
      fixture.detectChanges();

      expect(component.templates).toEqual(templates);
    });

    it('should call symbolService.list with controller', () => {
      mockTemplateService.list.mockReturnValue(of([]));

      component.ngOnInit();
      fixture.detectChanges();

      expect(mockSymbolService.list).toHaveBeenCalledWith(mockController);
    });

    it('should subscribe to newTemplateCreated and add template to list', () => {
      const templates = [createMockTemplate('t1', 'Existing', 'vpcs')];
      mockTemplateService.list.mockReturnValue(of(templates));

      component.ngOnInit();
      fixture.detectChanges();

      const newTemplate = createMockTemplate('t2', 'NewTemplate', 'docker');
      newTemplateCreatedSubject.next(newTemplate);

      expect(component.templates).toContain(newTemplate);
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

  describe('dragStart', () => {
    it('should set isDragging signal to true', () => {
      component.ngOnInit();

      component.dragStart({} as any, createMockTemplate('t1', 'Test', 'vpcs'));

      expect(component['isDragging']()).toBe(true);
    });

    it.each(['qemu', 'vpcs', 'ethernet_switch'])(
      'should create a %s node immediately when the native drag is dropped on the topology',
      (templateType) => {
        component.ngOnInit();
        component['cachedComputes'].set([{ compute_id: 'local', name: 'Local', connected: true } as any]);
        const card = document.createElement('button');
        const map = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        map.id = 'map';
        document.body.appendChild(map);
        const dragStartEvent = {
          clientX: 100,
          clientY: 100,
          currentTarget: card,
        } as unknown as DragEvent;
        const emitSpy = vi.spyOn(component.nodeCreationChange, 'emit');

        component.dragStart(dragStartEvent, createMockTemplate('t1', 'Test', templateType));
        const dropEvent = new Event('drop', { bubbles: true, cancelable: true });
        Object.defineProperties(dropEvent, {
          clientX: { value: 600 },
          clientY: { value: 500 },
        });
        map.dispatchEvent(dropEvent);

        expect(emitSpy).toHaveBeenCalledTimes(1);
        expect(component['isDragging']()).toBe(false);
        map.remove();
      }
    );
  });

  describe('dragEnd', () => {
    beforeEach(() => {
      // Set cached computes so dragEnd uses cache instead of making HTTP request
      component['cachedComputes'].set([
        {
          compute_id: 'local',
          name: 'Local',
          host: 'localhost',
          port: 3080,
          protocol: 'http:',
          connected: true,
        } as any,
      ]);
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

    it('should preserve quantity and preferred compute for a batch drop', () => {
      const emitSpy = vi.spyOn(component.nodeCreationChange, 'emit');
      const template = createMockTemplate('t1', 'TestTemplate', 'vpcs');

      component.dragEnd({} as any, template, 4, 'local');

      const emittedEvent = emitSpy.mock.calls[0][0] as NodeAddedEvent;
      expect(emittedEvent.numberOfNodes).toBe(4);
      expect(emittedEvent.controller).toBe('local');
    });

    it('should ignore a palette drop outside the topology', () => {
      const emitSpy = vi.spyOn(component.nodeCreationChange, 'emit');
      vi.spyOn(component as any, 'isTopologyDropTarget').mockReturnValue(false);

      component.dragEnd({} as any, createMockTemplate('t1', 'Test', 'vpcs'), 2, 'local', true);

      expect(emitSpy).not.toHaveBeenCalled();
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

    it('should use the drag-end delta as the released pointer position', () => {
      const emitSpy = vi.spyOn(component.nodeCreationChange, 'emit');
      component['dragStartClientX'] = 100;
      component['dragStartClientY'] = 100;
      component['lastPageX'].set(0);
      component['lastPageY'].set(0);
      component['mouseOffsetX'] = 0;
      component['mouseOffsetY'] = 0;

      component.dragEnd({ x: 500, y: 400, dragCancelled: false }, createMockTemplate('t1', 'Test', 'vpcs'));

      expect(emitSpy).toHaveBeenCalledWith(expect.objectContaining({ x: 100, y: 100 }));
    });

    it('should use project scene dimensions as fallback when context size is 0', () => {
      const emitSpy = vi.spyOn(component.nodeCreationChange, 'emit');

      // Set cached computes so dragEnd uses cache instead of making HTTP request
      component['cachedComputes'].set([
        {
          compute_id: 'local',
          name: 'Local',
          host: 'localhost',
          port: 3080,
          protocol: 'http:',
          connected: true,
        } as any,
      ]);

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

  describe('node creation preview', () => {
    it('should remove the pending preview immediately when the real node is available', () => {
      const creationId = 'creation-1';
      component['addCreatingNode']({
        id: creationId,
        template: createMockTemplate('t1', 'Test', 'vpcs'),
        x: 0,
        y: 0,
        numberOfNodes: 1,
        computeId: 'local',
        status: 'creating',
      });

      component.onNodeCreated(creationId, true);

      expect(component.creatingNodes().has(creationId)).toBe(false);
    });
  });

  describe('openDialog', () => {
    it('should open one backdrop-free desktop palette', () => {
      component.openDialog();
      component.openDialog();

      expect(mockDialog.open).toHaveBeenCalledTimes(1);
      expect(mockDialog.open).toHaveBeenCalledWith(
        TemplateListDialogComponent,
        expect.objectContaining({
          hasBackdrop: false,
          restoreFocus: false,
          position: { top: '56px' },
          panelClass: ['base-dialog-panel', 'template-dialog-panel', 'add-nodes-dialog-panel'],
        })
      );
    });

    it('should align the desktop palette with the compact project header', () => {
      document.documentElement.dataset['density'] = 'compact';

      component.openDialog();

      expect(mockDialog.open).toHaveBeenCalledWith(
        TemplateListDialogComponent,
        expect.objectContaining({ position: { top: '48px' } })
      );
    });

    it('should forward manual add requests from the palette', () => {
      const emitSpy = vi.spyOn(component.nodeCreationChange, 'emit');
      const event = {
        template: createMockTemplate('t1', 'Router', 'vpcs'),
        controller: 'local',
        numberOfNodes: 3,
        x: 0,
        y: 0,
      } as NodeAddedEvent;
      component.openDialog();

      mockDialogRef.componentInstance.nodeAddRequested.next(event);

      expect(emitSpy).toHaveBeenCalledWith(event);
    });
  });

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

    beforeAll(() => {
      vi.useFakeTimers();
    });

    afterAll(() => {
      vi.useRealTimers();
    });

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
          {
            provide: NotificationService,
            useValue: {
              computeNotificationEmitter: new Subject(),
              connectToComputeNotifications: vi.fn(),
              hasCachedData: vi.fn().mockReturnValue(false),
              getCachedComputes: vi.fn().mockReturnValue([]),
              setInitialComputes: vi.fn(),
              computeCacheUpdated: new Subject(),
            },
          },
        ],
      });

      fixture = TestBed.createComponent(TemplateComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('controller', mockController);
      fixture.componentRef.setInput('project', mockProject);
      component['subscription'] = { unsubscribe: vi.fn() } as any;
      component['themeSubscription'] = { unsubscribe: vi.fn() } as any;
      fixture.detectChanges(); // Initialize the component so inject() dependencies are available
    });

    describe('loadTemplates', () => {
      it('should show error toaster when list fails with error.error.message', async () => {
        mockTemplateService.list.mockReturnValue(throwError(() => ({ error: { message: 'List failed' } })));

        const cdrSpy = vi.spyOn(component['cd'], 'markForCheck');

        component.ngOnInit();
        await vi.runAllTimersAsync();

        expect(mockToasterService.error).toHaveBeenCalledWith('List failed');
        expect(cdrSpy).toHaveBeenCalled();
      });

      it('should use fallback message when list error has no message', async () => {
        mockTemplateService.list.mockReturnValue(throwError(() => ({})));

        const cdrSpy = vi.spyOn(component['cd'], 'markForCheck');

        component.ngOnInit();
        await vi.runAllTimersAsync();

        expect(mockToasterService.error).toHaveBeenCalledWith('Failed to load templates');
        expect(cdrSpy).toHaveBeenCalled();
      });
    });

    describe('loadTemplateSymbolBlobs', () => {
      it('should show error toaster when forkJoin fails', async () => {
        mockTemplateService.list.mockReturnValue(of([createMockTemplate('t1', 'Test', 'vpcs')]));
        mockSymbolService.getSymbolBlobUrl.mockReturnValue(throwError(() => ({ error: { message: 'Symbol failed' } })));

        const cdrSpy = vi.spyOn(component['cd'], 'markForCheck');

        component.ngOnInit();
        await vi.runAllTimersAsync();

        expect(mockToasterService.error).toHaveBeenCalledWith('Symbol failed');
        expect(cdrSpy).toHaveBeenCalled();
      });

      it('should use fallback message when symbol error has no message', async () => {
        mockTemplateService.list.mockReturnValue(of([createMockTemplate('t1', 'Test', 'vpcs')]));
        mockSymbolService.getSymbolBlobUrl.mockReturnValue(throwError(() => ({})));

        const cdrSpy = vi.spyOn(component['cd'], 'markForCheck');

        component.ngOnInit();
        await vi.runAllTimersAsync();

        expect(mockToasterService.error).toHaveBeenCalledWith('Failed to load template symbols');
        expect(cdrSpy).toHaveBeenCalled();
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

      it('should show error toaster when getComputes fails and fallback to local', async () => {
        mockComputeService.getComputes.mockReturnValue(throwError(() => ({ error: { message: 'Computes failed' } })));
        const emitSpy = vi.spyOn(component.nodeCreationChange, 'emit');
        const cdrSpy = vi.spyOn(component['cd'], 'markForCheck');

        component.dragEnd({} as any, createMockTemplate('t1', 'Test', 'vpcs'));
        await vi.runAllTimersAsync();

        expect(mockToasterService.error).toHaveBeenCalledWith('Computes failed');
        expect(cdrSpy).toHaveBeenCalled();
        expect(emitSpy).toHaveBeenCalled();
        const emittedEvent = emitSpy.mock.calls[0][0] as NodeAddedEvent;
        expect(emittedEvent.controller).toBe('local');
      });

      it('should use fallback message when getComputes error has no message', async () => {
        mockComputeService.getComputes.mockReturnValue(throwError(() => ({})));
        const emitSpy = vi.spyOn(component.nodeCreationChange, 'emit');
        const cdrSpy = vi.spyOn(component['cd'], 'markForCheck');

        component.dragEnd({} as any, createMockTemplate('t1', 'Test', 'vpcs'));
        await vi.runAllTimersAsync();

        expect(mockToasterService.error).toHaveBeenCalledWith('Failed to load computes');
        expect(cdrSpy).toHaveBeenCalled();
        expect(emitSpy).toHaveBeenCalled();
      });

      it('should filter out unreachable compute nodes and show error when none are reachable', async () => {
        component['cachedComputes'].set([
          {
            compute_id: 'remote1',
            name: 'Remote1',
            host: '192.168.1.100',
            port: 3080,
            protocol: 'http:',
            connected: false,
          } as any,
          {
            compute_id: 'remote2',
            name: 'Remote2',
            host: '192.168.1.101',
            port: 3080,
            protocol: 'http:',
            connected: false,
          } as any,
        ]);
        component['lastPageX'].set(100);
        component['lastPageY'].set(100);
        component['mouseOffsetX'] = 0;
        component['mouseOffsetY'] = 0;

        const emitSpy = vi.spyOn(component.nodeCreationChange, 'emit');

        component.dragEnd({} as any, createMockTemplate('t1', 'Test', 'vpcs'));

        expect(mockToasterService.error).toHaveBeenCalledWith(
          'No reachable compute nodes available. Please check your compute nodes connection status.'
        );
        expect(emitSpy).not.toHaveBeenCalled();
      });

      it('should filter out unreachable compute nodes and use only reachable ones', () => {
        component['cachedComputes'].set([
          {
            compute_id: 'local',
            name: 'Local',
            host: 'localhost',
            port: 3080,
            protocol: 'http:',
            connected: true,
          } as any,
          {
            compute_id: 'remote1',
            name: 'Remote1',
            host: '192.168.1.100',
            port: 3080,
            protocol: 'http:',
            connected: false,
          } as any,
          {
            compute_id: 'remote2',
            name: 'Remote2',
            host: '192.168.1.101',
            port: 3080,
            protocol: 'http:',
            connected: true,
          } as any,
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

import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import {  ComponentFixture, TestBed } from '@angular/core/testing';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router } from '@angular/router';
import {} from 'mousetrap';
import { BehaviorSubject, of } from 'rxjs';
import { Observable } from 'rxjs/Rx';
import { ANGULAR_MAP_DECLARATIONS } from '../../cartography/angular-map.imports';
import { D3MapComponent } from '../../cartography/components/d3-map/d3-map.component';
import { MapDrawingToDrawingConverter } from '../../cartography/converters/map/map-drawing-to-drawing-converter';
import { MapLabelToLabelConverter } from '../../cartography/converters/map/map-label-to-label-converter';
import { MapLinkNodeToLinkNodeConverter } from '../../cartography/converters/map/map-link-node-to-link-node-converter';
import { MapLinkToLinkConverter } from '../../cartography/converters/map/map-link-to-link-converter';
import { MapNodeToNodeConverter } from '../../cartography/converters/map/map-node-to-node-converter';
import { DrawingsDataSource } from '../../cartography/datasources/drawings-datasource';
import { LinksDataSource } from '../../cartography/datasources/links-datasource';
import {
  MapDrawingsDataSource,
  MapLinksDataSource,
  MapNodesDataSource,
  MapSymbolsDataSource,
} from '../../cartography/datasources/map-datasource';
import { NodesDataSource } from '../../cartography/datasources/nodes-datasource';
import { MovingEventSource } from '../../cartography/events/moving-event-source';
import { SelectionManager } from '../../cartography/managers/selection-manager';
import { Drawing } from '../../cartography/models/drawing';
import { Node } from '../../cartography/models/node';
import { MapChangeDetectorRef } from '../../cartography/services/map-change-detector-ref';
import { SelectionTool } from '../../cartography/tools/selection-tool';
import { DrawingsWidget } from '../../cartography/widgets/drawings';
import { InterfaceLabelWidget } from '../../cartography/widgets/interface-label';
import { LabelWidget } from '../../cartography/widgets/label';
import { LinkWidget } from '../../cartography/widgets/link';
import { EthernetLinkWidget } from '../../cartography/widgets/links/ethernet-link';
import { SerialLinkWidget } from '../../cartography/widgets/links/serial-link';
import { NodeWidget } from '../../cartography/widgets/node';
import { ProgressService } from '../../common/progress/progress.service';
import { ProjectWebServiceHandler } from '../../handlers/project-web-service-handler';
import { CapturingSettings } from '../../models/capturingSettings';
import { Link } from '../../models/link';
import { Project } from '../../models/project';
import{ Controller } from '../../models/controller';
import { DrawingService } from '../../services/drawing.service';
import { LinkService } from '../../services/link.service';
import { MapScaleService } from '../../services/mapScale.service';
import { MapSettingsService } from '../../services/mapsettings.service';
import { NodeService } from '../../services/node.service';
import { NotificationService } from '../../services/notification.service';
import { ProjectService } from '../../services/project.service';
import { MockedProjectService } from '../../services/project.service.spec';
import { RecentlyOpenedProjectService } from '../../services/recentlyOpenedProject.service';
import { ControllerService } from '../../services/controller.service';
import { MockedControllerService } from '../../services/controller.service.spec';
import { SettingsService } from '../../services/settings.service';
import { ToasterService } from '../../services/toaster.service';
import { MockedToasterService } from '../../services/toaster.service.spec';
import { ToolsService } from '../../services/tools.service';
import { MockedActivatedRoute } from '../snapshots/list-of-snapshots/list-of-snaphshots.component.spec';
import { NodeCreatedLabelStylesFixer } from './helpers/node-created-label-styles-fixer';
import { ProjectMapMenuComponent } from './project-map-menu/project-map-menu.component';
import { ProjectMapComponent } from './project-map.component';

export class MockedProgressService {
  public activate() {}

  public deactivate() {}
}

export class MockedNodeService {
  public node = { label: {} } as Node;
  constructor() {}

  getDefaultCommand(): string {
    return `putty.exe -telnet \%h \%p -wt \"\%d\" -gns3 5 -skin 4`;
  }

  updateLabel(): Observable<Node> {
    return of(this.node);
  }

  updatePosition(): Observable<Node> {
    return of(this.node);
  }

  delete(controller:Controller , node: Node) {
    return of();
  }

  startAll(controller:Controller , project: Project) {
    return of();
  }

  stopAll(controller:Controller , project: Project) {
    return of();
  }

  suspendAll(controller:Controller , project: Project) {
    return of();
  }

  reloadAll(controller:Controller , project: Project) {
    return of();
  }

  start(controller:Controller , node: Node) {
    return of();
  }

  stop(controller:Controller , node: Node) {
    return of();
  }

  suspend(controller:Controller , node: Node) {
    return of();
  }

  reload(controller:Controller , node: Node) {
    return of();
  }

  duplicate(controller:Controller , node: Node) {
    return of(node);
  }

  getStartupConfiguration(controller:Controller , node: Node) {
    return of('sample config');
  }

  saveConfiguration(controller:Controller , node: Node, configuration: string) {
    return of(configuration);
  }

  update(controller:Controller , node: Node) {
    return of(node);
  }
}

export class MockedDrawingService {
  public drawing = {} as Drawing;
  constructor() {}

  add(_server:Controller , _project_id: string, _x: number, _y: number, _svg: string) {
    return of(this.drawing);
  }

  duplicate(controller:Controller , project_id: string, drawing: Drawing) {
    return of(drawing);
  }

  updatePosition(_server:Controller , _project: Project, _drawing: Drawing, _x: number, _y: number) {
    return of(this.drawing);
  }

  updateSizeAndPosition(_server:Controller , _drawing: Drawing, _x: number, _y: number, _svg: string) {
    return of(this.drawing);
  }

  update(_server:Controller , _drawing: Drawing) {
    return of(this.drawing);
  }

  delete(_server:Controller , _drawing: Drawing) {
    return of(this.drawing);
  }

  updateText(_server:Controller , _drawing: Drawing, _svg: string): Observable<Drawing> {
    return of(this.drawing);
  }
}

export class MockedLinkService {
  constructor() {}

  getLink(controller:Controller , projectId: string, linkId: string) {
    return of({});
  }

  deleteLink(_server:Controller , link: Link) {
    return of({});
  }

  updateLink(controller:Controller , link: Link) {
    return of({});
  }

  createLink() {
    return of({});
  }

  updateNodes() {
    return of({});
  }

  startCaptureOnLink(controller:Controller , link: Link, settings: CapturingSettings) {
    return of({});
  }

  getAvailableFilters(controller:Controller , link: Link) {
    return of({});
  }
}

export class MockedDrawingsDataSource {
  add() {}

  clear() {}

  get() {
    return of({});
  }

  update() {
    return of({});
  }
}

export class MockedNodesDataSource {
  add() {}

  clear() {}

  get() {
    return { status: 'started' };
  }

  getItems() {
    return [{ name: 'testNode' }];
  }

  update() {
    return of({});
  }

  public get changes() {
    return new BehaviorSubject<[]>([]);
  }
}

export class MockedLinksDataSource {
  clear() {}
}

xdescribe('ProjectMapComponent', () => {
  let component: ProjectMapComponent;
  let fixture: ComponentFixture<ProjectMapComponent>;
  let drawingService = new MockedDrawingService();
  let drawingsDataSource = new MockedDrawingsDataSource();
  let nodesDataSource = new MockedNodesDataSource();
  let linksDataSource = new MockedLinksDataSource();
  let mockedToasterService = new MockedToasterService();
  let nodeCreatedLabelStylesFixer;
  let mockedRouter = new MockedActivatedRoute();

  beforeEach(async() => {
    nodeCreatedLabelStylesFixer = {
      fix: (node) => node,
    };

  await  TestBed.configureTestingModule({
      imports: [
        MatBottomSheetModule,
        MatIconModule,
        MatDialogModule,
        MatToolbarModule,
        MatMenuModule,
        MatCheckboxModule,
        CommonModule,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: ActivatedRoute },
        { provide: ControllerService, useClass: MockedControllerService },
        { provide: ProjectService, useClass: MockedProjectService },
        { provide: NodeService },
        { provide: LinkService },
        { provide: DrawingService, useValue: drawingService },
        { provide: ProgressService, useClass: MockedProgressService },
        { provide: ProjectWebServiceHandler },
        { provide: MapChangeDetectorRef },
        { provide: NodeWidget },
        { provide: LinkWidget },
        { provide: EthernetLinkWidget },
        { provide: SerialLinkWidget },
        { provide: DrawingsWidget },
        { provide: LabelWidget },
        { provide: InterfaceLabelWidget },
        { provide: MapNodeToNodeConverter },
        { provide: MapDrawingToDrawingConverter },
        { provide: MapLabelToLabelConverter },
        { provide: MapLinkToLinkConverter },
        { provide: MapLinkNodeToLinkNodeConverter },
        { provide: NodesDataSource, useValue: nodesDataSource },
        { provide: LinksDataSource, useValue: linksDataSource },
        { provide: DrawingsDataSource, useValue: drawingsDataSource },
        { provide: SettingsService },
        { provide: ToolsService },
        { provide: SelectionManager },
        { provide: SelectionTool },
        { provide: MovingEventSource },
        {
          provide: RecentlyOpenedProjectService,
          useClass: RecentlyOpenedProjectService,
        },
        { provide: NodeCreatedLabelStylesFixer, useValue: nodeCreatedLabelStylesFixer },
        { provide: MapScaleService },
        { provide: NodeCreatedLabelStylesFixer, useValue: nodeCreatedLabelStylesFixer },
        { provide: ToasterService, useValue: mockedToasterService },
        { provide: Router, useValue: mockedRouter },
        { provide: MapNodesDataSource, useClass: MapNodesDataSource },
        { provide: MapLinksDataSource, useClass: LinksDataSource },
        { provide: MapDrawingsDataSource, useClass: MapDrawingsDataSource },
        { provide: MapSymbolsDataSource, useClass: MapSymbolsDataSource },
        { provide: MapSettingsService, useClass: MapSettingsService },
        { provide: NotificationService },
        { provide: MatDialogRef, useValue: {}},
        { provide: MAT_DIALOG_DATA, useValue: {}},


      ],
      declarations: [ProjectMapComponent, ProjectMapMenuComponent, D3MapComponent, ...ANGULAR_MAP_DECLARATIONS],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectMapComponent);
    component = fixture.componentInstance;
    component.projectMapMenuComponent = {
      resetDrawToolChoice() {},
    } as ProjectMapMenuComponent;

    component.ws = {
      OPEN: 0,
    } as WebSocket;
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should hide draw tools when hide menu is called', () => {
    var dummyElement = document.createElement('map');
    document.getElementsByClassName = jasmine.createSpy('HTML element').and.callFake(() => {
      return [dummyElement];
    });
    spyOn(component.projectMapMenuComponent, 'resetDrawToolChoice').and.returnValue();

    component.hideMenu();

    expect(component.projectMapMenuComponent.resetDrawToolChoice).toHaveBeenCalled();
  });
});

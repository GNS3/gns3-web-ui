import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectMapComponent } from './project-map.component';
import { MatIconModule, MatToolbarModule, MatMenuModule, MatCheckboxModule } from '@angular/material';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ServerService } from '../../services/server.service';
import { ProjectService } from '../../services/project.service';
import { SettingsService } from '../../services/settings.service';
import { NodeService } from '../../services/node.service';
import { LinkService } from '../../services/link.service';
import { DrawingService } from '../../services/drawing.service';
import { ProgressService } from '../../common/progress/progress.service';
import { ProjectWebServiceHandler } from '../../handlers/project-web-service-handler';
import { MapChangeDetectorRef } from '../../cartography/services/map-change-detector-ref';
import { NodeWidget } from '../../cartography/widgets/node';
import { MapNodeToNodeConverter } from '../../cartography/converters/map/map-node-to-node-converter';
import { NodesDataSource } from '../../cartography/datasources/nodes-datasource';
import { LinksDataSource } from '../../cartography/datasources/links-datasource';
import { DrawingsDataSource } from '../../cartography/datasources/drawings-datasource';
import { CommonModule } from '@angular/common';
import { ANGULAR_MAP_DECLARATIONS } from '../../cartography/angular-map.imports';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MockedSettingsService } from '../../services/settings.service.spec';
import { MockedServerService } from '../../services/server.service.spec';
import { MockedProjectService } from '../../services/project.service.spec';
import { Observable } from 'rxjs/Rx';
import { Drawing } from '../../cartography/models/drawing';
import { D3MapComponent } from '../../cartography/components/d3-map/d3-map.component';
import { of } from 'rxjs';
import { Server } from '../../models/server';
import { Node } from '../../cartography/models/node';
import { ToolsService } from '../../services/tools.service';
import { DrawingsWidget } from '../../cartography/widgets/drawings';
import { MapDrawingToDrawingConverter } from '../../cartography/converters/map/map-drawing-to-drawing-converter';
import { MapLabelToLabelConverter } from '../../cartography/converters/map/map-label-to-label-converter';
import { SelectionManager } from '../../cartography/managers/selection-manager';
import { SelectionTool } from '../../cartography/tools/selection-tool';
import { RecentlyOpenedProjectService } from '../../services/recentlyOpenedProject.service';
import { MapLinkToLinkConverter } from '../../cartography/converters/map/map-link-to-link-converter';
import { Link } from '../../models/link';
import { Project } from '../../models/project';
import { MovingEventSource } from '../../cartography/events/moving-event-source';
import { CapturingSettings } from '../../models/capturingSettings';
import { LinkWidget } from '../../cartography/widgets/link';
import { MapScaleService } from '../../services/mapScale.service';
import { NodeCreatedLabelStylesFixer } from './helpers/node-created-label-styles-fixer';
import { LabelWidget } from '../../cartography/widgets/label';
import { InterfaceLabelWidget } from '../../cartography/widgets/interface-label';
import { MapLinkNodeToLinkNodeConverter } from '../../cartography/converters/map/map-link-node-to-link-node-converter';
import { MapSettingService } from '../../services/mapsettings.service';
import { ProjectMapMenuComponent } from './project-map-menu/project-map-menu.component';
import { MockedToasterService } from '../../services/toaster.service.spec';
import { ToasterService } from '../../services/toaster.service';

export class MockedProgressService {
  public activate() {}

  public deactivate() {}
}

export class MockedNodeService {
  public node = { label: {} } as Node;
  constructor() {}

  updateLabel(): Observable<Node> {
    return of(this.node);
  }

  updatePosition(): Observable<Node> {
    return of(this.node);
  }

  delete(server: Server, node: Node) {
    return of();
  }

  startAll(server: Server, project: Project) {
    return of();
  }

  stopAll(server: Server, project: Project) {
    return of();
  }

  suspendAll(server: Server, project: Project) {
    return of();
  }

  reloadAll(server: Server, project: Project) {
    return of();
  }

  duplicate(server: Server, node: Node) {
    return of(node);
  }

  getConfiguration(server: Server, node: Node) {
    return of('sample config');
  }

  saveConfiguration(server: Server, node: Node, configuration: string) {
    return of(configuration);
  }
}

export class MockedDrawingService {
  public drawing = {} as Drawing;
  constructor() {}

  add(_server: Server, _project_id: string, _x: number, _y: number, _svg: string) {
    return of(this.drawing);
  }

  duplicate(server: Server, project_id: string, drawing: Drawing) {
    return of(drawing);
  }

  updatePosition(_server: Server, _drawing: Drawing, _x: number, _y: number) {
    return of(this.drawing);
  }

  updateSizeAndPosition(_server: Server, _drawing: Drawing, _x: number, _y: number, _svg: string) {
    return of(this.drawing);
  }

  update(_server: Server, _drawing: Drawing) {
    return of(this.drawing);
  }

  delete(_server: Server, _drawing: Drawing) {
    return of(this.drawing);
  }

  updateText(_server: Server, _drawing: Drawing, _svg: string): Observable<Drawing> {
    return of(this.drawing);
  }
}

export class MockedLinkService {
  constructor() {}

  getLink(server: Server, projectId: string, linkId: string) {
    return of({});
  }

  deleteLink(_server: Server, link: Link){
    return of({});
  }

  updateLink(server: Server, link: Link) {
    return of({});
  }

  createLink() {
    return of({});
  }

  updateNodes() {
    return of({});
  }

  startCaptureOnLink(server: Server, link: Link, settings: CapturingSettings) {
    return of({});
  }

  getAvailableFilters(server: Server, link: Link) { 
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
    return {status: 'started'};
  }

  update() {
    return of({});
  }
}

export class MockedLinksDataSource {
  clear() {}
}

describe('ProjectMapComponent', () => {
  let component: ProjectMapComponent;
  let fixture: ComponentFixture<ProjectMapComponent>;
  let drawingService = new MockedDrawingService();
  let drawingsDataSource = new MockedDrawingsDataSource();
  let nodesDataSource = new MockedNodesDataSource();
  let linksDataSource = new MockedLinksDataSource();
  let mockedToasterService = new MockedToasterService();
  let nodeCreatedLabelStylesFixer;

  beforeEach(async(() => {
    nodeCreatedLabelStylesFixer = {
      fix: (node) => node
    };

    TestBed.configureTestingModule({
      imports: [MatIconModule, MatToolbarModule, MatMenuModule, MatCheckboxModule, CommonModule, NoopAnimationsModule],
      providers: [
        { provide: ActivatedRoute },
        { provide: ServerService, useClass: MockedServerService },
        { provide: ProjectService, useClass: MockedProjectService },
        { provide: NodeService },
        { provide: LinkService },
        { provide: DrawingService, useValue: drawingService },
        { provide: ProgressService, useClass: MockedProgressService },
        { provide: ProjectWebServiceHandler },
        { provide: MapChangeDetectorRef },
        { provide: NodeWidget },
        { provide: LinkWidget },
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
        { provide: SettingsService, useClass: MockedSettingsService },
        { provide: ToolsService },
        { provide: SelectionManager },
        { provide: SelectionTool },
        { provide: MovingEventSource },
        {
          provide: RecentlyOpenedProjectService,
          useClass: RecentlyOpenedProjectService
        },
        { provide: NodeCreatedLabelStylesFixer, useValue: nodeCreatedLabelStylesFixer},
        { provide: MapScaleService },
        { provide: NodeCreatedLabelStylesFixer, useValue: nodeCreatedLabelStylesFixer},
        { provide: ToasterService, useValue: mockedToasterService }
      ],
      declarations: [ProjectMapComponent, ProjectMapMenuComponent, D3MapComponent, ...ANGULAR_MAP_DECLARATIONS],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectMapComponent);
    component = fixture.componentInstance;
    component.projectMapMenuComponent = { 
      resetDrawToolChoice(){}
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

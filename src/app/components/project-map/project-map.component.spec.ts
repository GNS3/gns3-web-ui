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
import { MapPortToPortConverter } from '../../cartography/converters/map/map-port-to-port-converter';
import { NodesDataSource } from '../../cartography/datasources/nodes-datasource';
import { LinksDataSource } from '../../cartography/datasources/links-datasource';
import { NodesEventSource } from '../../cartography/events/nodes-event-source';
import { DrawingsEventSource } from '../../cartography/events/drawings-event-source';
import { LinksEventSource } from '../../cartography/events/links-event-source';
import { MapDrawingToSvgConverter } from '../../cartography/converters/map/map-drawing-to-svg-converter';
import { DrawingsDataSource } from '../../cartography/datasources/drawings-datasource';
import { CommonModule } from '@angular/common';
import { ANGULAR_MAP_DECLARATIONS } from '../../cartography/angular-map.imports';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SymbolService } from '../../services/symbol.service';
import { MockedSettingsService } from '../../services/settings.service.spec';
import { MockedServerService } from '../../services/server.service.spec';
import { MockedProjectService } from '../../services/project.service.spec';
import { Observable } from 'rxjs/Rx';
import { Drawing } from '../../cartography/models/drawing';
import { D3MapComponent } from '../../cartography/components/d3-map/d3-map.component';
import { Project } from '../../models/project';
import { of } from 'rxjs';
import { DrawingElement } from '../../cartography/models/drawings/drawing-element';
import { RectElement } from '../../cartography/models/drawings/rect-element';
import { MapDrawing } from '../../cartography/models/map/map-drawing';
import { HttpServer } from '../../services/http-server.service';
import { Server } from '../../models/server';
import { ResizedDataEvent } from '../../cartography/events/event-source';
import { MapLabelToLabelConverter } from '../../cartography/converters/map/map-label-to-label-converter';

export class MockedProgressService {
  public activate() {}
}

export class MockedDrawingService {
  public drawing = {} as Drawing;
  constructor() {}

  add(_server: Server, _project_id:string, _x: number, _y:number, _svg: string) {
    return of(this.drawing);
  }

  updatePosition(_server: Server, _drawing: Drawing, _x: number, _y: number){
    return of(this.drawing);
  }

  updateSizeAndPosition(_server: Server, _drawing: Drawing, _x: number, _y: number, _svg: string){
    return of(this.drawing);
  }

  update(_server: Server, _drawing: Drawing){
    return of(this.drawing);
  }

  delete(_server: Server, _drawing: Drawing){
    return of(this.drawing);
  }
}

export class MockedDrawingsDataSource {
  add() {}

  get() { return of({})}

  update() { return of({})}
}

describe('ProjectMapComponent', () => {
  let component: ProjectMapComponent;
  let fixture: ComponentFixture<ProjectMapComponent>;
  let drawingService = new MockedDrawingService;
  let drawingsDataSource = new MockedDrawingsDataSource;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        MatIconModule,
        MatToolbarModule,
        MatMenuModule,
        MatCheckboxModule,
        CommonModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: ActivatedRoute },
        { provide: ServerService, useClass: MockedServerService },
        { provide: ProjectService, useClass: MockedProjectService },
        { provide: SymbolService },
        { provide: NodeService },
        { provide: LinkService },
        { provide: DrawingService, useValue: drawingService},
        { provide: ProgressService, useClass: MockedProgressService },
        { provide: ProjectWebServiceHandler },
        { provide: MapChangeDetectorRef },
        { provide: NodeWidget },
        { provide: MapNodeToNodeConverter },
        { provide: MapPortToPortConverter },
        { provide: NodesDataSource },
        { provide: LinksDataSource },
        { provide: DrawingsDataSource, useValue: drawingsDataSource},
        { provide: NodesEventSource },
        { provide: DrawingsEventSource },
        { provide: LinksEventSource },
        { provide: MapDrawingToSvgConverter, useValue: {
          convert: () => { return ''}
        } },
        { provide: SettingsService, useClass: MockedSettingsService },
        { provide: MapLabelToLabelConverter}
      ],
      declarations: [
        ProjectMapComponent,
        D3MapComponent,
        ...ANGULAR_MAP_DECLARATIONS
      ],
      schemas: [
        NO_ERRORS_SCHEMA
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectMapComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should update position on resizing event', () => {
    let drawingElement: DrawingElement;
    let rect = new RectElement();
    rect.fill = "#ffffff";
    rect.fill_opacity = 1.0;
    rect.stroke = "#000000";
    rect.stroke_width = 2;
    rect.width = 200;
    rect.height = 100;
    drawingElement = rect;
    let mapDrawing = new MapDrawing;
    mapDrawing.id = '1';
    mapDrawing.projectId = '1';
    mapDrawing.rotation = 1;
    mapDrawing.svg = '';
    mapDrawing.x = 0;
    mapDrawing.y = 0;
    mapDrawing.z = 0;
    mapDrawing.element = drawingElement;
    let event = new ResizedDataEvent<MapDrawing>(mapDrawing,0,0,100,100);
    spyOn(drawingService, 'updateSizeAndPosition').and.returnValue( Observable.of({}));

    component.onDrawingResized(event);

    expect(drawingService.updateSizeAndPosition).toHaveBeenCalled();
  });

  it('should add selected drawing', () => {
    component.mapChild = { context: {} } as D3MapComponent;
    component.project = { project_id: "1" } as Project;
    component.mapChild.context.getZeroZeroTransformationPoint = jasmine.createSpy('HTML element').and.callFake(() => { return {x: 0, y: 0}});
    var dummyElement = document.createElement('map');
    document.getElementsByClassName = jasmine.createSpy('HTML element').and.callFake(() => { return ([dummyElement])});
    spyOn(drawingsDataSource, 'add');

    component.addDrawing("rectangle");
    dummyElement.click();

    expect(drawingsDataSource.add).toHaveBeenCalled();
  });

  it('should hide draw tools when hide menu is called', () => {
    var dummyElement = document.createElement('map');
    document.getElementsByClassName = jasmine.createSpy('HTML element').and.callFake(() => { return ([dummyElement])});
    spyOn(component, 'resetDrawToolChoice');

    component.hideMenu();

    expect(component.resetDrawToolChoice).toHaveBeenCalled();
  });

  it('should return drawing mock of correct type'), () => {
    let mock = component.getDrawingMock('rectangle');

    expect(mock instanceof RectElement).toBe(true);
  }
});

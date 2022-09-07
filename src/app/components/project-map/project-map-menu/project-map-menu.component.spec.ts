import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ProjectService } from '../../../services/project.service';
import { ElectronService } from 'ngx-electron';
import { ANGULAR_MAP_DECLARATIONS } from '../../../cartography/angular-map.imports';
import { D3MapComponent } from '../../../cartography/components/d3-map/d3-map.component';
import { DrawingService } from '../../../services/drawing.service';
import { MapSettingsService } from '../../../services/mapsettings.service';
import { SymbolService } from '../../../services/symbol.service';
import { ToolsService } from '../../../services/tools.service';
import { MockedSymbolService } from '../../preferences/common/symbols/symbols.component.spec';
import { MockedDrawingService,MockedDrawingsDataSource } from '../project-map.component.spec';
import { ProjectMapMenuComponent } from './project-map-menu.component';
import { MockedProjectService } from '../../../services/project.service.spec';
import { MockedNodesDataSource, MockedNodeService } from '../project-map.component.spec';
import { NodeService } from '../../../services/node.service';
import { NodesDataSource } from '../../../cartography/datasources/nodes-datasource';
import { DrawingsEventSource } from '../../../cartography/events/drawings-event-source';
import { DrawingsDataSource } from '../../../cartography/datasources/drawings-datasource';

describe('ProjectMapMenuComponent', () => {
  let component: ProjectMapMenuComponent;
  let fixture: ComponentFixture<ProjectMapMenuComponent>;
  let drawingService = new MockedDrawingService();
  let mapSettingService = new MapSettingsService();
  let mockedSymbolService = new MockedSymbolService();
  let mockedProjectService: MockedProjectService = new MockedProjectService();
  let mockedNodeService: MockedNodeService = new MockedNodeService();
  let mockedNodesDataSource: MockedNodesDataSource = new MockedNodesDataSource();
  let mockedDrawingsDataSource = new MockedDrawingsDataSource();
  let mockedDrawingsEventSource = new DrawingsEventSource();

  beforeEach(async() => {
   await TestBed.configureTestingModule({
      imports: [
        MatIconModule,
        MatDialogModule,
        MatToolbarModule,
        MatMenuModule,
        MatCheckboxModule,
        CommonModule,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: DrawingService, useValue: drawingService },
        { provide: DrawingsDataSource, useValue: mockedDrawingsDataSource },
        { provide: DrawingsEventSource, useValue: mockedDrawingsEventSource },
        { provide: ProjectService, useValue: mockedProjectService },
        { provide: ToolsService, useClass: ToolsService },
        { provide: MapSettingsService, useValue: mapSettingService },
        { provide: SymbolService, useValue: mockedSymbolService },
        { provide: NodeService, useValue: mockedNodeService },
        { provide: NodesDataSource, useValue: mockedNodesDataSource },
        { provide: ElectronService },
      ],
      declarations: [ProjectMapMenuComponent, D3MapComponent, ...ANGULAR_MAP_DECLARATIONS],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectMapMenuComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should reset choice on draw menu after saving drawing', () => {
    spyOn(component, 'resetDrawToolChoice');

    component.onDrawingSaved();

    expect(component.resetDrawToolChoice).toHaveBeenCalled();
  });

  it('should call map settings service when lock value was changed', () => {
    spyOn(mapSettingService, 'changeMapLockValue');

    component.changeLockValue();

    expect(mapSettingService.changeMapLockValue).toHaveBeenCalled();
  });

  it('should call map settings service with proper value', () => {
    spyOn(mapSettingService, 'changeMapLockValue');

    component.changeLockValue();
    expect(mapSettingService.changeMapLockValue).toHaveBeenCalledWith(true);;

    component.changeLockValue();
    expect(mapSettingService.changeMapLockValue).toHaveBeenCalledWith(false);;
  });
});

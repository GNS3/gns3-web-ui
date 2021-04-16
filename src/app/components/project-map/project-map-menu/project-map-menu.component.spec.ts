import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ElectronService } from 'ngx-electron';
import { ANGULAR_MAP_DECLARATIONS } from '../../../cartography/angular-map.imports';
import { D3MapComponent } from '../../../cartography/components/d3-map/d3-map.component';
import { DrawingService } from '../../../services/drawing.service';
import { MapSettingsService } from '../../../services/mapsettings.service';
import { SymbolService } from '../../../services/symbol.service';
import { ToolsService } from '../../../services/tools.service';
import { MockedSymbolService } from '../../preferences/common/symbols/symbols.component.spec';
import { MockedDrawingService } from '../project-map.component.spec';
import { ProjectMapMenuComponent } from './project-map-menu.component';

describe('ProjectMapMenuComponent', () => {
  let component: ProjectMapMenuComponent;
  let fixture: ComponentFixture<ProjectMapMenuComponent>;
  let drawingService = new MockedDrawingService();
  let mapSettingService = new MapSettingsService();
  let mockedSymbolService = new MockedSymbolService();

  beforeEach(async(() => {
    TestBed.configureTestingModule({
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
        { provide: ToolsService },
        { provide: MapSettingsService, useValue: mapSettingService },
        { provide: SymbolService, useValue: mockedSymbolService },
        { provide: ElectronService },
      ],
      declarations: [ProjectMapMenuComponent, D3MapComponent, ...ANGULAR_MAP_DECLARATIONS],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

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
    expect(mapSettingService.changeMapLockValue).toHaveBeenCalledWith(true);

    component.changeLockValue();
    expect(mapSettingService.changeMapLockValue).toHaveBeenCalledWith(false);
  });
});

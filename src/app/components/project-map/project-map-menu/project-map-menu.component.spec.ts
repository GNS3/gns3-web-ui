import { ProjectMapMenuComponent } from "./project-map-menu.component";
import { ComponentFixture, async, TestBed } from '@angular/core/testing';
import { MockedDrawingService } from '../project-map.component.spec';
import { MapSettingsService } from '../../../services/mapsettings.service';
import { MatIconModule, MatToolbarModule, MatMenuModule, MatCheckboxModule } from '@angular/material';
import { CommonModule } from '@angular/common';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DrawingService } from '../../../services/drawing.service';
import { ToolsService } from '../../../services/tools.service';
import { D3MapComponent } from '../../../cartography/components/d3-map/d3-map.component';
import { ANGULAR_MAP_DECLARATIONS } from '../../../cartography/angular-map.imports';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('ProjectMapMenuComponent', () => {
    let component: ProjectMapMenuComponent;
    let fixture: ComponentFixture<ProjectMapMenuComponent>;
    let drawingService = new MockedDrawingService();
    let mapSettingService = new MapSettingsService();

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [MatIconModule, MatToolbarModule, MatMenuModule, MatCheckboxModule, CommonModule, NoopAnimationsModule],
            providers: [
              { provide: DrawingService, useValue: drawingService },
              { provide: ToolsService },
              { provide: MapSettingsService, useValue: mapSettingService }
            ],
            declarations: [ProjectMapMenuComponent, D3MapComponent, ...ANGULAR_MAP_DECLARATIONS],
            schemas: [NO_ERRORS_SCHEMA]
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

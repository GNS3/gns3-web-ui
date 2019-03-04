import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCheckboxModule, MatIconModule, MatToolbarModule, MatMenuModule, MatTableModule } from '@angular/material';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { CustomAdaptersComponent } from './custom-adapters.component';

describe('Custom adapters component', () => {
    let component: CustomAdaptersComponent;
    let fixture: ComponentFixture<CustomAdaptersComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
        imports:  [MatTableModule, MatIconModule, MatToolbarModule, MatMenuModule, MatCheckboxModule, CommonModule, NoopAnimationsModule],
        declarations: [
            CustomAdaptersComponent
        ],
        schemas: [NO_ERRORS_SCHEMA]
        }).compileComponents();
    }));
    
    beforeEach(() => {
        fixture = TestBed.createComponent(CustomAdaptersComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });
    
    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should emit event when apply clicked', () => {
        spyOn(component.saveConfigurationEmitter, 'emit');

        component.configureCustomAdapters();

        expect(component.saveConfigurationEmitter.emit).toHaveBeenCalled();
    });

    it('should emit event when cancel clicked', () => {
        spyOn(component.closeConfiguratorEmitter, 'emit');

        component.cancelConfigureCustomAdapters();

        expect(component.closeConfiguratorEmitter.emit).toHaveBeenCalled();
    });
});

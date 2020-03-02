import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { GeneralPreferencesComponent } from './general-preferences.component';
import { MockedActivatedRoute } from '../preferences.component.spec';
import { MATERIAL_IMPORTS } from '../../../material.imports';

describe('GeneralPreferencesComponent', () => {
    let component: GeneralPreferencesComponent;
    let fixture: ComponentFixture<GeneralPreferencesComponent>;
    let activatedRoute = new MockedActivatedRoute().get();
  
    beforeEach(async(() => {
      TestBed.configureTestingModule({
        imports: [MATERIAL_IMPORTS, CommonModule, NoopAnimationsModule, RouterTestingModule.withRoutes([])],
        providers: [
            {
                provide: ActivatedRoute,  useValue: activatedRoute
            }
        ],
        declarations: [
            GeneralPreferencesComponent
        ],
        schemas: [NO_ERRORS_SCHEMA]
      }).compileComponents();
    }));
  
    beforeEach(() => {
      fixture = TestBed.createComponent(GeneralPreferencesComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });
  
    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should set correct server id', () => {
        expect(component.serverId).toBe('1');
    });
});

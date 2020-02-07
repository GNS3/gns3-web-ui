import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCheckboxModule, MatIconModule, MatMenuModule, MatToolbarModule } from '@angular/material';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { MockedActivatedRoute } from '../preferences.component.spec';
import { BuiltInPreferencesComponent } from './built-in-preferences.component';

describe('BuiltInPreferencesComponent', () => {
    let component: BuiltInPreferencesComponent;
    let fixture: ComponentFixture<BuiltInPreferencesComponent>;
    const activatedRoute = new MockedActivatedRoute().get();
  
    beforeEach(async(() => {
      TestBed.configureTestingModule({
        imports: [MatIconModule, MatToolbarModule, MatMenuModule, MatCheckboxModule, CommonModule, NoopAnimationsModule, RouterTestingModule.withRoutes([])],
        providers: [
            {
                provide: ActivatedRoute,  useValue: activatedRoute
            }
        ],
        declarations: [
            BuiltInPreferencesComponent
        ],
        schemas: [NO_ERRORS_SCHEMA]
      }).compileComponents();
    }));
  
    beforeEach(() => {
      fixture = TestBed.createComponent(BuiltInPreferencesComponent);
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

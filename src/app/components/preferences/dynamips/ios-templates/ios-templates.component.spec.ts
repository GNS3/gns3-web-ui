import { ComponentFixture, async, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MockedServerService } from '../../../../services/server.service.spec';
import { ServerService } from '../../../../services/server.service';
import { Server } from '../../../../models/server';
import { MockedActivatedRoute } from '../../preferences.component.spec';
import { IosTemplate } from '../../../../models/templates/ios-template';
import { IosTemplatesComponent } from './ios-templates.component';
import { IosService } from '../../../../services/ios.service';
import { MATERIAL_IMPORTS } from '../../../../material.imports';

export class MockedIosService {
    public getTemplates(server: Server) {
        return of([{} as IosTemplate]);
    }
}

describe('IosTemplatesComponent', () => {
    let component: IosTemplatesComponent;
    let fixture: ComponentFixture<IosTemplatesComponent>;

    let mockedServerService = new MockedServerService;
    let mockedIosService = new MockedIosService;
    let activatedRoute = new MockedActivatedRoute().get();
    
    beforeEach(async(() => {
        TestBed.configureTestingModule({
          imports: [MATERIAL_IMPORTS, CommonModule, NoopAnimationsModule, RouterTestingModule.withRoutes([])],
          providers: [
              {
                  provide: ActivatedRoute,  useValue: activatedRoute
              },
              { provide: ServerService, useValue: mockedServerService },
              { provide: IosService, useValue: mockedIosService }
          ],
          declarations: [
              IosTemplatesComponent
          ],
          schemas: [NO_ERRORS_SCHEMA]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(IosTemplatesComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCheckboxModule, MatIconModule, MatMenuModule, MatToolbarModule } from '@angular/material';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { Server } from '../../../../../models/server';
import { EthernetHubTemplate } from '../../../../../models/templates/ethernet-hub-template';
import { BuiltInTemplatesService } from '../../../../../services/built-in-templates.service';
import { ServerService } from '../../../../../services/server.service';
import { MockedServerService } from '../../../../../services/server.service.spec';
import { MockedActivatedRoute } from '../../../preferences.component.spec';
import { EthernetHubsTemplatesComponent } from './ethernet-hubs-templates.component';

export class MockedBuiltInTemplatesService {
    public getTemplates(server: Server) {
        return of([{} as EthernetHubTemplate]);
    }
}

describe('EthernetHubsTemplatesComponent', () => {
    let component: EthernetHubsTemplatesComponent;
    let fixture: ComponentFixture<EthernetHubsTemplatesComponent>;

    const mockedServerService = new MockedServerService;
    const mockedBuiltInTemplatesService = new MockedBuiltInTemplatesService;
    const activatedRoute = new MockedActivatedRoute().get();
    
    beforeEach(async(() => {
        TestBed.configureTestingModule({
          imports: [MatIconModule, MatToolbarModule, MatMenuModule, MatCheckboxModule, CommonModule, NoopAnimationsModule, RouterTestingModule.withRoutes([])],
          providers: [
              {
                  provide: ActivatedRoute,  useValue: activatedRoute
              },
              { provide: ServerService, useValue: mockedServerService },
              { provide: BuiltInTemplatesService, useValue: mockedBuiltInTemplatesService }
          ],
          declarations: [
              EthernetHubsTemplatesComponent
          ],
          schemas: [NO_ERRORS_SCHEMA]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(EthernetHubsTemplatesComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

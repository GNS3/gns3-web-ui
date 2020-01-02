import { ComponentFixture, async, TestBed } from '@angular/core/testing';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { CommonModule } from '@angular/common';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Server } from '../../../../../models/server';
import { MockedServerService } from '../../../../../services/server.service.spec';
import { MockedActivatedRoute } from '../../../preferences.component.spec';
import { ServerService } from '../../../../../services/server.service';
import { BuiltInTemplatesService } from '../../../../../services/built-in-templates.service';
import { EthernetSwitchesTemplatesComponent } from './ethernet-switches-templates.component';
import { EthernetSwitchTemplate } from '../../../../../models/templates/ethernet-switch-template';

export class MockedBuiltInTemplatesService {
    public getTemplates(server: Server) {
        return of([{} as EthernetSwitchTemplate]);
    }
}

describe('EthernetSwitchesTemplatesComponent', () => {
    let component: EthernetSwitchesTemplatesComponent;
    let fixture: ComponentFixture<EthernetSwitchesTemplatesComponent>;

    let mockedServerService = new MockedServerService;
    let mockedBuiltInTemplatesService = new MockedBuiltInTemplatesService;
    let activatedRoute = new MockedActivatedRoute().get();
    
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
              EthernetSwitchesTemplatesComponent
          ],
          schemas: [NO_ERRORS_SCHEMA]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(EthernetSwitchesTemplatesComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

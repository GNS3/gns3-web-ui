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
import { MockedServerService } from '../../../../services/server.service.spec';
import { ServerService } from '../../../../services/server.service';
import { Server } from '../../../../models/server';
import { VpcsService } from '../../../../services/vpcs.service';
import { VpcsTemplate } from '../../../../models/templates/vpcs-template';
import { VpcsTemplatesComponent } from './vpcs-templates.component';
import { MockedActivatedRoute } from '../../preferences.component.spec';

export class MockedVpcsService {
    public getTemplates(server: Server) {
        return of([{} as VpcsTemplate]);
    }
}

describe('VpcsTemplatesComponent', () => {
    let component: VpcsTemplatesComponent;
    let fixture: ComponentFixture<VpcsTemplatesComponent>;

    let mockedServerService = new MockedServerService;
    let mockedVpcsService = new MockedVpcsService;
    let activatedRoute = new MockedActivatedRoute().get();
    
    beforeEach(async(() => {
        TestBed.configureTestingModule({
          imports: [MatIconModule, MatToolbarModule, MatMenuModule, MatCheckboxModule, CommonModule, NoopAnimationsModule, RouterTestingModule.withRoutes([])],
          providers: [
              {
                  provide: ActivatedRoute,  useValue: activatedRoute
              },
              { provide: ServerService, useValue: mockedServerService },
              { provide: VpcsService, useValue: mockedVpcsService }
          ],
          declarations: [
              VpcsTemplatesComponent
          ],
          schemas: [NO_ERRORS_SCHEMA]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(VpcsTemplatesComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCheckboxModule, MatIconModule, MatMenuModule, MatToolbarModule } from '@angular/material';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { Observable, of } from 'rxjs';
import { Server } from '../../../../models/server';
import { VirtualBoxTemplate } from '../../../../models/templates/virtualbox-template';
import { ServerService } from '../../../../services/server.service';
import { MockedServerService } from '../../../../services/server.service.spec';
import { VirtualBoxService } from '../../../../services/virtual-box.service';
import { MockedActivatedRoute } from '../../preferences.component.spec';
import { VirtualBoxTemplatesComponent } from './virtual-box-templates.component';

export class MockedVirtualBoxService {
    public getTemplates(server: Server) {
        return of([{} as VirtualBoxTemplate]);
    }
}

describe('VirtualBoxTemplatesComponent', () => {
    let component: VirtualBoxTemplatesComponent;
    let fixture: ComponentFixture<VirtualBoxTemplatesComponent>;

    const mockedServerService = new MockedServerService;
    const mockedVirtualBoxService = new MockedVirtualBoxService;
    const activatedRoute = new MockedActivatedRoute().get();
    
    beforeEach(async(() => {
        TestBed.configureTestingModule({
          imports: [MatIconModule, MatToolbarModule, MatMenuModule, MatCheckboxModule, CommonModule, NoopAnimationsModule, RouterTestingModule.withRoutes([])],
          providers: [
              {
                  provide: ActivatedRoute,  useValue: activatedRoute
              },
              { provide: ServerService, useValue: mockedServerService },
              { provide: VirtualBoxService, useValue: mockedVirtualBoxService }
          ],
          declarations: [
              VirtualBoxTemplatesComponent
          ],
          schemas: [NO_ERRORS_SCHEMA]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(VirtualBoxTemplatesComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

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
import { QemuTemplate } from '../../../../models/templates/qemu-template';
import { QemuVmTemplatesComponent } from './qemu-vm-templates.component';
import { QemuService } from '../../../../services/qemu.service';
import { MATERIAL_IMPORTS } from '../../../../material.imports';

export class MockedQemuService {
    public getTemplates(server: Server) {
        return of([{} as QemuTemplate]);
    }
}

describe('QemuTemplatesComponent', () => {
    let component: QemuVmTemplatesComponent;
    let fixture: ComponentFixture<QemuVmTemplatesComponent>;

    let mockedServerService = new MockedServerService;
    let mockedQemuService = new MockedQemuService;
    let activatedRoute = new MockedActivatedRoute().get();
    
    beforeEach(async(() => {
        TestBed.configureTestingModule({
          imports: [MATERIAL_IMPORTS, CommonModule, NoopAnimationsModule, RouterTestingModule.withRoutes([])],
          providers: [
              {
                  provide: ActivatedRoute,  useValue: activatedRoute
              },
              { provide: ServerService, useValue: mockedServerService },
              { provide: QemuService, useValue: mockedQemuService }
          ],
          declarations: [
              QemuVmTemplatesComponent
          ],
          schemas: [NO_ERRORS_SCHEMA]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(QemuVmTemplatesComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

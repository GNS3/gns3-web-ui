import { ComponentFixture, async, TestBed } from '@angular/core/testing';
import { MatIconModule, MatToolbarModule, MatMenuModule, MatCheckboxModule, MatTableModule } from '@angular/material';
import { CommonModule } from '@angular/common';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MockedServerService } from '../../../../services/server.service.spec';
import { ServerService } from '../../../../services/server.service';
import { Server } from '../../../../models/server';
import { MockedToasterService } from '../../../../services/toaster.service.spec';
import { ToasterService } from '../../../../services/toaster.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MockedActivatedRoute } from '../../preferences.component.spec';
import { QemuTemplate } from '../../../../models/templates/qemu-template';
import { QemuVmTemplateDetailsComponent } from './qemu-vm-template-details.component';
import { QemuService } from '../../../../services/qemu.service';

export class MockedQemuService {
    public getTemplate(server: Server, template_id: string) {
        return of({} as QemuTemplate);  
    }

    public saveTemplate(server: Server, qemuTemplate: QemuTemplate) {
        return of(qemuTemplate);    
    }

    public getBinaries(server: Server) {
        return of([]);    
    }

    public getImages(server: Server) {
        return of([]);    
    }
}

describe('QemuVmTemplateDetailsComponent', () => {
    let component: QemuVmTemplateDetailsComponent;
    let fixture: ComponentFixture<QemuVmTemplateDetailsComponent>;

    let mockedServerService = new MockedServerService;
    let mockedQemuService = new MockedQemuService;
    let mockedToasterService = new MockedToasterService;
    let activatedRoute = new MockedActivatedRoute().get();
    
    beforeEach(async(() => {
        TestBed.configureTestingModule({
          imports: [FormsModule, ReactiveFormsModule, MatTableModule, MatIconModule, MatToolbarModule, MatMenuModule, MatCheckboxModule, CommonModule, NoopAnimationsModule, RouterTestingModule.withRoutes([])],
          providers: [
              {
                  provide: ActivatedRoute,  useValue: activatedRoute
              },
              { provide: ServerService, useValue: mockedServerService },
              { provide: QemuService, useValue: mockedQemuService },
              { provide: ToasterService, useValue: mockedToasterService}
          ],
          declarations: [
              QemuVmTemplateDetailsComponent
          ],
          schemas: [NO_ERRORS_SCHEMA]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(QemuVmTemplateDetailsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call save template', () => {
        spyOn(mockedQemuService, 'saveTemplate').and.returnValue(of({} as QemuTemplate));

        component.onSave();

        expect(mockedQemuService.saveTemplate).toHaveBeenCalled();
    });
});

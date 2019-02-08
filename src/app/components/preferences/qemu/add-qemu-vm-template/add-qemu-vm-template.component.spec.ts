import { ComponentFixture, async, TestBed } from '@angular/core/testing';
import { MatIconModule, MatToolbarModule, MatMenuModule, MatCheckboxModule, MatSelectModule, MatAutocompleteModule, MatFormFieldModule, MatInputModule } from '@angular/material';
import { CommonModule } from '@angular/common';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MockedServerService } from '../../../../services/server.service.spec';
import { ServerService } from '../../../../services/server.service';
import { Server } from '../../../../models/server';
import { ToasterService } from '../../../../services/toaster.service';
import { TemplateMocksService } from '../../../../services/template-mocks.service';
import { MockedToasterService } from '../../../../services/toaster.service.spec';
import { MockedActivatedRoute } from '../../preferences.component.spec';
import { QemuTemplate } from '../../../../models/templates/qemu-template';
import { AddQemuVmTemplateComponent } from './add-qemu-vm-template.component';
import { QemuService } from '../../../../services/qemu.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { QemuConfigurationService } from '../../../../services/qemu-configuration.service';

export class MockedQemuService {
    public addTemplate(server: Server, qemuTemplate: QemuTemplate) {
        return of(qemuTemplate);    
    }

    public getBinaries(server: Server) {
        return of([]);    
    }

    public getImages(server: Server) {
        return of([]);    
    }
}

describe('AddQemuVmTemplateComponent', () => {
    let component: AddQemuVmTemplateComponent;
    let fixture: ComponentFixture<AddQemuVmTemplateComponent>;

    let mockedServerService = new MockedServerService;
    let mockedQemuService = new MockedQemuService;
    let mockedToasterService = new MockedToasterService;
    let activatedRoute = new MockedActivatedRoute().get();
    let router = {
        navigate: jasmine.createSpy('navigate')
    };
    
    beforeEach(async(() => {
        TestBed.configureTestingModule({
          imports: [FormsModule, ReactiveFormsModule, MatSelectModule, MatAutocompleteModule, MatIconModule, MatFormFieldModule, MatInputModule,
            MatToolbarModule, MatMenuModule, MatCheckboxModule, CommonModule, NoopAnimationsModule, RouterTestingModule.withRoutes([])],
          providers: [
              {
                  provide: ActivatedRoute,  useValue: activatedRoute
              },
              { provide: Router, useValue: router },
              { provide: ServerService, useValue: mockedServerService },
              { provide: QemuService, useValue: mockedQemuService },
              { provide: ToasterService, useValue: mockedToasterService},
              { provide: TemplateMocksService, useClass: TemplateMocksService },
              { provide: QemuConfigurationService, useClass: QemuConfigurationService }
          ],
          declarations: [
              AddQemuVmTemplateComponent
          ],
          schemas: [NO_ERRORS_SCHEMA]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(AddQemuVmTemplateComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call add template', () => {
        spyOn(mockedQemuService, 'addTemplate').and.returnValue(of({} as QemuTemplate));
        component.firstStepForm.controls['templateName'].setValue('template name');
        component.secondStepForm.controls['ramMemory'].setValue(0);
        component.fourthStepForm.controls['fileName'].setValue('file name');
        component.chosenImage = 'path';
        component.selectedBinary = {
            path: 'path',
            version: 'version'
        };
        component.newImageSelected = true;
        component.server = {id: 1} as Server;

        component.addTemplate();

        expect(mockedQemuService.addTemplate).toHaveBeenCalled();
    });

    it('should not call add template when template name is empty', () => {
        spyOn(mockedQemuService, 'addTemplate').and.returnValue(of({} as QemuTemplate));
        component.firstStepForm.controls['templateName'].setValue('');
        component.secondStepForm.controls['ramMemory'].setValue(0);
        component.fourthStepForm.controls['fileName'].setValue('file name');
        component.chosenImage = 'path';
        component.selectedBinary = {
            path: 'path',
            version: 'version'
        };
        component.newImageSelected = true;
        component.server = {id: 1} as Server;

        component.addTemplate();

        expect(mockedQemuService.addTemplate).not.toHaveBeenCalled();
    });

    it('should not call add template when ram is not set', () => {
        spyOn(mockedQemuService, 'addTemplate').and.returnValue(of({} as QemuTemplate));
        component.firstStepForm.controls['templateName'].setValue('template name');
        component.fourthStepForm.controls['fileName'].setValue('file name');
        component.chosenImage = 'path';
        component.selectedBinary = {
            path: 'path',
            version: 'version'
        };
        component.newImageSelected = true;
        component.server = {id: 1} as Server;

        component.addTemplate();

        expect(mockedQemuService.addTemplate).not.toHaveBeenCalled();
    });
});

import { ComponentFixture, async, TestBed } from '@angular/core/testing';
import { MatIconModule, MatToolbarModule, MatMenuModule, MatCheckboxModule } from '@angular/material';
import { CommonModule } from '@angular/common';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MockedServerService } from '../../../../services/server.service.spec';
import { ServerService } from '../../../../services/server.service';
import { AddVpcsTemplateComponent } from './add-vpcs-template.component';
import { Server } from '../../../../models/server';
import { VpcsService } from '../../../../services/vpcs.service';
import { ToasterService } from '../../../../services/toaster.service';
import { TemplateMocksService } from '../../../../services/template-mocks.service';
import { MockedToasterService } from '../../../../services/toaster.service.spec';
import { VpcsTemplate } from '../../../../models/templates/vpcs-template';
import { MockedActivatedRoute } from '../../preferences.component.spec';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

export class MockedVpcsService {
    public addTemplate(server: Server, vpcsTemplate: VpcsTemplate) {
        return of(vpcsTemplate);    
    }
}

describe('AddVpcsTemplateComponent', () => {
    let component: AddVpcsTemplateComponent;
    let fixture: ComponentFixture<AddVpcsTemplateComponent>;

    let mockedServerService = new MockedServerService;
    let mockedVpcsService = new MockedVpcsService;
    let mockedToasterService = new MockedToasterService;
    let activatedRoute = new MockedActivatedRoute().get();
    
    beforeEach(async(() => {
        TestBed.configureTestingModule({
          imports: [FormsModule, ReactiveFormsModule, MatIconModule, MatToolbarModule, MatMenuModule, MatCheckboxModule, CommonModule, NoopAnimationsModule, RouterTestingModule.withRoutes([])],
          providers: [
              {
                  provide: ActivatedRoute,  useValue: activatedRoute
              },
              { provide: ServerService, useValue: mockedServerService },
              { provide: VpcsService, useValue: mockedVpcsService },
              { provide: ToasterService, useValue: mockedToasterService},
              { provide: TemplateMocksService, useClass: TemplateMocksService }
          ],
          declarations: [
              AddVpcsTemplateComponent
          ],
          schemas: [NO_ERRORS_SCHEMA]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(AddVpcsTemplateComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call add template', () => {
        spyOn(mockedVpcsService, 'addTemplate').and.returnValue(of({} as VpcsTemplate));
        component.templateName = "sample name";
        component.templateNameForm.controls['templateName'].setValue('template name');
        component.server = {id: 1} as Server;

        component.addTemplate();

        expect(mockedVpcsService.addTemplate).toHaveBeenCalled();
    });

    it('should not call add template when template name is empty', () => {
        spyOn(mockedVpcsService, 'addTemplate').and.returnValue(of({} as VpcsTemplate));
        spyOn(mockedToasterService, 'error');
        component.templateName = "";
        component.server = {id: 1} as Server;

        component.addTemplate();

        expect(mockedVpcsService.addTemplate).not.toHaveBeenCalled();
        expect(mockedToasterService.error).toHaveBeenCalled();
    });
});

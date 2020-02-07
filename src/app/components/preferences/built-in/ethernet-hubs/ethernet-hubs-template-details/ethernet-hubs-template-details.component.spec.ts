import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule, MatIconModule, MatMenuModule, MatTableModule, MatToolbarModule } from '@angular/material';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { Server } from '../../../../../models/server';
import { EthernetHubTemplate } from '../../../../../models/templates/ethernet-hub-template';
import { BuiltInTemplatesConfigurationService } from '../../../../../services/built-in-templates-configuration.service';
import { BuiltInTemplatesService } from '../../../../../services/built-in-templates.service';
import { ServerService } from '../../../../../services/server.service';
import { MockedServerService } from '../../../../../services/server.service.spec';
import { ToasterService } from '../../../../../services/toaster.service';
import { MockedToasterService } from '../../../../../services/toaster.service.spec';
import { MockedActivatedRoute } from '../../../preferences.component.spec';
import { EthernetHubsTemplateDetailsComponent } from './ethernet-hubs-template-details.component';

export class MockedBuiltInTemplatesService {
    public getTemplate(server: Server, template_id: string) {
        return of({ports_mapping: []} as EthernetHubTemplate);  
    }

    public saveTemplate(server: Server, cloudTemplate: EthernetHubTemplate) {
        return of(cloudTemplate);    
    }
}

describe('EthernetHubsTemplateDetailsComponent', () => {
    let component: EthernetHubsTemplateDetailsComponent;
    let fixture: ComponentFixture<EthernetHubsTemplateDetailsComponent>;

    const mockedServerService = new MockedServerService;
    const mockedBuiltInTemplatesService = new MockedBuiltInTemplatesService;
    const mockedToasterService = new MockedToasterService;
    const activatedRoute = new MockedActivatedRoute().get();
    
    beforeEach(async(() => {
        TestBed.configureTestingModule({
          imports: [FormsModule, ReactiveFormsModule, MatTableModule, MatIconModule, MatToolbarModule, MatMenuModule, MatCheckboxModule, CommonModule, NoopAnimationsModule, RouterTestingModule.withRoutes([])],
          providers: [
              {
                  provide: ActivatedRoute,  useValue: activatedRoute
              },
              { provide: ServerService, useValue: mockedServerService },
              { provide: BuiltInTemplatesService, useValue: mockedBuiltInTemplatesService },
              { provide: ToasterService, useValue: mockedToasterService},
              { provide: BuiltInTemplatesConfigurationService, useClass: BuiltInTemplatesConfigurationService }
          ],
          declarations: [
                EthernetHubsTemplateDetailsComponent
          ],
          schemas: [NO_ERRORS_SCHEMA]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(EthernetHubsTemplateDetailsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call save template', () => {
        spyOn(mockedBuiltInTemplatesService, 'saveTemplate').and.returnValue(of({} as EthernetHubTemplate));
        component.numberOfPorts = 2;
        component.inputForm.controls['templateName'].setValue('template name');
        component.inputForm.controls['defaultName'].setValue('default name');
        component.inputForm.controls['symbol'].setValue('symbol');
        component.ethernetHubTemplate = {ports_mapping: []} as EthernetHubTemplate;

        component.onSave();

        expect(mockedBuiltInTemplatesService.saveTemplate).toHaveBeenCalled();
    });

    it('should not call save template when template name is empty', () => {
        spyOn(mockedBuiltInTemplatesService, 'saveTemplate').and.returnValue(of({} as EthernetHubTemplate));
        component.numberOfPorts = 2;
        component.inputForm.controls['templateName'].setValue('');
        component.inputForm.controls['defaultName'].setValue('default name');
        component.inputForm.controls['symbol'].setValue('symbol');
        component.ethernetHubTemplate = {ports_mapping: []} as EthernetHubTemplate;

        component.onSave();

        expect(mockedBuiltInTemplatesService.saveTemplate).not.toHaveBeenCalled();
    });

    it('should not call save template when default name is empty', () => {
        spyOn(mockedBuiltInTemplatesService, 'saveTemplate').and.returnValue(of({} as EthernetHubTemplate));
        component.numberOfPorts = 2;
        component.inputForm.controls['templateName'].setValue('template name');
        component.inputForm.controls['defaultName'].setValue('');
        component.inputForm.controls['symbol'].setValue('symbol');
        component.ethernetHubTemplate = {ports_mapping: []} as EthernetHubTemplate;

        component.onSave();

        expect(mockedBuiltInTemplatesService.saveTemplate).not.toHaveBeenCalled();
    });

    it('should call save template when symbol path is empty', () => {
        spyOn(mockedBuiltInTemplatesService, 'saveTemplate').and.returnValue(of({} as EthernetHubTemplate));
        component.numberOfPorts = 2;
        component.inputForm.controls['templateName'].setValue('template name');
        component.inputForm.controls['defaultName'].setValue('default name');
        component.inputForm.controls['symbol'].setValue('');
        component.ethernetHubTemplate = {ports_mapping: []} as EthernetHubTemplate;

        component.onSave();

        expect(mockedBuiltInTemplatesService.saveTemplate).not.toHaveBeenCalled();
    });
});

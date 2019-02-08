import { ComponentFixture, async, TestBed } from '@angular/core/testing';
import { MatIconModule, MatToolbarModule, MatMenuModule, MatCheckboxModule, MatTableModule } from '@angular/material';
import { CommonModule } from '@angular/common';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Server } from '../../../../../models/server';
import { MockedServerService } from '../../../../../services/server.service.spec';
import { MockedToasterService } from '../../../../../services/toaster.service.spec';
import { MockedActivatedRoute } from '../../../preferences.component.spec';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ServerService } from '../../../../../services/server.service';
import { ToasterService } from '../../../../../services/toaster.service';
import { BuiltInTemplatesService } from '../../../../../services/built-in-templates.service';
import { EthernetSwitchTemplate } from '../../../../../models/templates/ethernet-switch-template';
import { EthernetSwitchesTemplateDetailsComponent } from './ethernet-switches-template-details.component';

export class MockedBuiltInTemplatesService {
    public getTemplate(server: Server, template_id: string) {
        return of({ports_mapping: []} as EthernetSwitchTemplate);  
    }

    public saveTemplate(server: Server, cloudTemplate: EthernetSwitchTemplate) {
        return of(cloudTemplate);    
    }
}

describe('EthernetSwitchesTemplateDetailsComponent', () => {
    let component: EthernetSwitchesTemplateDetailsComponent;
    let fixture: ComponentFixture<EthernetSwitchesTemplateDetailsComponent>;

    let mockedServerService = new MockedServerService;
    let mockedBuiltInTemplatesService = new MockedBuiltInTemplatesService;
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
              { provide: BuiltInTemplatesService, useValue: mockedBuiltInTemplatesService },
              { provide: ToasterService, useValue: mockedToasterService}
          ],
          declarations: [
                EthernetSwitchesTemplateDetailsComponent
          ],
          schemas: [NO_ERRORS_SCHEMA]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(EthernetSwitchesTemplateDetailsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call save template', () => {
        spyOn(mockedBuiltInTemplatesService, 'saveTemplate').and.returnValue(of({} as EthernetSwitchTemplate));
        component.inputForm.controls['templateName'].setValue('template name');
        component.inputForm.controls['defaultName'].setValue('default name');
        component.inputForm.controls['symbol'].setValue('symbol');
        component.ethernetSwitchTemplate = {ports_mapping: []} as EthernetSwitchTemplate;

        component.onSave();

        expect(mockedBuiltInTemplatesService.saveTemplate).toHaveBeenCalled();
    });

    it('should not call save template when template name is empty', () => {
        spyOn(mockedBuiltInTemplatesService, 'saveTemplate').and.returnValue(of({} as EthernetSwitchTemplate));
        component.inputForm.controls['templateName'].setValue('');
        component.inputForm.controls['defaultName'].setValue('default name');
        component.inputForm.controls['symbol'].setValue('symbol');
        component.ethernetSwitchTemplate = {ports_mapping: []} as EthernetSwitchTemplate;

        component.onSave();

        expect(mockedBuiltInTemplatesService.saveTemplate).not.toHaveBeenCalled();
    });

    it('should not call save template when default name is empty', () => {
        spyOn(mockedBuiltInTemplatesService, 'saveTemplate').and.returnValue(of({} as EthernetSwitchTemplate));
        component.inputForm.controls['templateName'].setValue('template name');
        component.inputForm.controls['defaultName'].setValue('');
        component.inputForm.controls['symbol'].setValue('symbol');
        component.ethernetSwitchTemplate = {ports_mapping: []} as EthernetSwitchTemplate;

        component.onSave();

        expect(mockedBuiltInTemplatesService.saveTemplate).not.toHaveBeenCalled();
    });

    it('should call save template when symbol path is empty', () => {
        spyOn(mockedBuiltInTemplatesService, 'saveTemplate').and.returnValue(of({} as EthernetSwitchTemplate));
        component.inputForm.controls['templateName'].setValue('template name');
        component.inputForm.controls['defaultName'].setValue('default name');
        component.inputForm.controls['symbol'].setValue('');
        component.ethernetSwitchTemplate = {ports_mapping: []} as EthernetSwitchTemplate;

        component.onSave();

        expect(mockedBuiltInTemplatesService.saveTemplate).not.toHaveBeenCalled();
    });
});

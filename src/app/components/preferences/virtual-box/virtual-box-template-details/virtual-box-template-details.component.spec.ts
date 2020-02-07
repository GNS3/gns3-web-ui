import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule, MatIconModule, MatMenuModule, MatTableModule, MatToolbarModule } from '@angular/material';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { Observable, of } from 'rxjs';
import { Server } from '../../../../models/server';
import { VirtualBoxTemplate } from '../../../../models/templates/virtualbox-template';
import { ServerService } from '../../../../services/server.service';
import { MockedServerService } from '../../../../services/server.service.spec';
import { ToasterService } from '../../../../services/toaster.service';
import { MockedToasterService } from '../../../../services/toaster.service.spec';
import { VirtualBoxConfigurationService } from '../../../../services/virtual-box-configuration.service';
import { VirtualBoxService } from '../../../../services/virtual-box.service';
import { MockedActivatedRoute } from '../../preferences.component.spec';
import { VirtualBoxTemplateDetailsComponent } from './virtual-box-template-details.component';

export class MockedVirtualBoxService {
    public getTemplate(server: Server, template_id: string) {
        return of({} as VirtualBoxTemplate);  
    }

    public saveTemplate(server: Server, virtualBoxTemplate: VirtualBoxTemplate) {
        return of(virtualBoxTemplate);    
    }
}

describe('VirtualBoxTemplateDetailsComponent', () => {
    let component: VirtualBoxTemplateDetailsComponent;
    let fixture: ComponentFixture<VirtualBoxTemplateDetailsComponent>;

    const mockedServerService = new MockedServerService;
    const mockedVirtualBoxService = new MockedVirtualBoxService;
    const mockedToasterService = new MockedToasterService;
    const activatedRoute = new MockedActivatedRoute().get();
    
    beforeEach(async(() => {
        TestBed.configureTestingModule({
          imports: [FormsModule, ReactiveFormsModule, MatTableModule , MatIconModule, MatToolbarModule, MatMenuModule, MatCheckboxModule, CommonModule, NoopAnimationsModule, RouterTestingModule.withRoutes([])],
          providers: [
              {
                  provide: ActivatedRoute,  useValue: activatedRoute
              },
              { provide: ServerService, useValue: mockedServerService },
              { provide: VirtualBoxService, useValue: mockedVirtualBoxService },
              { provide: ToasterService, useValue: mockedToasterService },
              { provide: VirtualBoxConfigurationService, useClass: VirtualBoxConfigurationService }
          ],
          declarations: [
              VirtualBoxTemplateDetailsComponent
          ],
          schemas: [NO_ERRORS_SCHEMA]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(VirtualBoxTemplateDetailsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call save template', () => {
        spyOn(mockedVirtualBoxService, 'saveTemplate').and.returnValue(of({} as VirtualBoxTemplate));
        component.generalSettingsForm.controls['templateName'].setValue('template name');
        component.generalSettingsForm.controls['defaultName'].setValue('default name');
        component.generalSettingsForm.controls['symbol'].setValue('symbol');
        component.generalSettingsForm.controls['ram'].setValue('256');
        component.networkForm.controls['adapters'].setValue('1');
        component.networkForm.controls['nameFormat'].setValue('{}');
        component.networkForm.controls['size'].setValue('256');
        component.virtualBoxTemplate = {
            adapters: 0,
            custom_adapters: []
        } as VirtualBoxTemplate;

        component.onSave();

        expect(mockedVirtualBoxService.saveTemplate).toHaveBeenCalled();
    });

    it('should not call save template when general settings are not filled', () => {
        spyOn(mockedVirtualBoxService, 'saveTemplate').and.returnValue(of({} as VirtualBoxTemplate));
        component.generalSettingsForm.controls['templateName'].setValue('');
        component.generalSettingsForm.controls['defaultName'].setValue('default name');
        component.generalSettingsForm.controls['symbol'].setValue('symbol');
        component.generalSettingsForm.controls['ram'].setValue('256');
        component.networkForm.controls['adapters'].setValue('1');
        component.networkForm.controls['nameFormat'].setValue('{}');
        component.networkForm.controls['size'].setValue('256');
        component.virtualBoxTemplate = {
            adapters: 0,
            custom_adapters: []
        } as VirtualBoxTemplate;

        component.onSave();

        expect(mockedVirtualBoxService.saveTemplate).not.toHaveBeenCalled();
    });

    it('should not call save template when network settings are not filled', () => {
        spyOn(mockedVirtualBoxService, 'saveTemplate').and.returnValue(of({} as VirtualBoxTemplate));
        component.generalSettingsForm.controls['templateName'].setValue('template name');
        component.generalSettingsForm.controls['defaultName'].setValue('default name');
        component.generalSettingsForm.controls['symbol'].setValue('symbol');
        component.generalSettingsForm.controls['ram'].setValue('256');
        component.networkForm.controls['adapters'].setValue('');
        component.networkForm.controls['nameFormat'].setValue('{}');
        component.networkForm.controls['size'].setValue('256');
        component.virtualBoxTemplate = {
            adapters: 0,
            custom_adapters: []
        } as VirtualBoxTemplate;

        component.onSave();

        expect(mockedVirtualBoxService.saveTemplate).not.toHaveBeenCalled();
    });
});

import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule, MatIconModule, MatMenuModule, MatToolbarModule } from '@angular/material';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { Server } from '../../../../models/server';
import { IosTemplate } from '../../../../models/templates/ios-template';
import { IosConfigurationService } from '../../../../services/ios-configuration.service';
import { IosService } from '../../../../services/ios.service';
import { ServerService } from '../../../../services/server.service';
import { MockedServerService } from '../../../../services/server.service.spec';
import { ToasterService } from '../../../../services/toaster.service';
import { MockedToasterService } from '../../../../services/toaster.service.spec';
import { MockedActivatedRoute } from '../../preferences.component.spec';
import { IosTemplateDetailsComponent } from './ios-template-details.component';

export class MockedIosService {
    public getTemplate(server: Server, template_id: string) {
        return of({} as IosTemplate);  
    }

    public saveTemplate(server: Server, iosTemplate: IosTemplate) {
        return of(iosTemplate);    
    }
}

describe('IosTemplateDetailsComponent', () => {
    let component: IosTemplateDetailsComponent;
    let fixture: ComponentFixture<IosTemplateDetailsComponent>;

    const mockedServerService = new MockedServerService;
    const mockedIosService = new MockedIosService;
    const mockedToasterService = new MockedToasterService;
    const activatedRoute = new MockedActivatedRoute().get();
    
    beforeEach(async(() => {
        TestBed.configureTestingModule({
          imports: [FormsModule, ReactiveFormsModule, MatIconModule, MatToolbarModule, MatMenuModule, MatCheckboxModule, CommonModule, NoopAnimationsModule, RouterTestingModule.withRoutes([])],
          providers: [
              {
                  provide: ActivatedRoute,  useValue: activatedRoute
              },
              { provide: ServerService, useValue: mockedServerService },
              { provide: IosService, useValue: mockedIosService },
              { provide: ToasterService, useValue: mockedToasterService },
              { provide: IosConfigurationService, useClass: IosConfigurationService }
          ],
          declarations: [
              IosTemplateDetailsComponent
          ],
          schemas: [NO_ERRORS_SCHEMA]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(IosTemplateDetailsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call save template', () => {
        spyOn(mockedIosService, 'saveTemplate').and.returnValue(of({} as IosTemplate));
        component.generalSettingsForm.controls['templateName'].setValue('template name');
        component.generalSettingsForm.controls['defaultName'].setValue('default name');
        component.generalSettingsForm.controls['symbol'].setValue('symbol');
        component.generalSettingsForm.controls['path'].setValue('path');
        component.generalSettingsForm.controls['initialConfig'].setValue('txt');
        component.memoryForm.controls['ram'].setValue('0');
        component.memoryForm.controls['nvram'].setValue('0');
        component.memoryForm.controls['iomemory'].setValue('0');
        component.memoryForm.controls['disk0'].setValue('0');
        component.memoryForm.controls['disk1'].setValue('0');
        component.advancedForm.controls['systemId'].setValue('0');
        component.advancedForm.controls['idlemax'].setValue('0');
        component.advancedForm.controls['idlesleep'].setValue('0');
        component.advancedForm.controls['execarea'].setValue('0');

        component.onSave();

        expect(mockedIosService.saveTemplate).toHaveBeenCalled();
    });
});

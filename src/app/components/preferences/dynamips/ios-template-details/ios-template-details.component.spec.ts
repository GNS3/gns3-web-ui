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
import { MockedToasterService } from '../../../../services/toaster.service.spec';
import { ToasterService } from '../../../../services/toaster.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MockedActivatedRoute } from '../../preferences.component.spec';
import { IosTemplate } from '../../../../models/templates/ios-template';
import { IosTemplateDetailsComponent } from './ios-template-details.component';
import { IosService } from '../../../../services/ios.service';
import { IosConfigurationService } from '../../../../services/ios-configuration.service';

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

    let mockedServerService = new MockedServerService;
    let mockedIosService = new MockedIosService;
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

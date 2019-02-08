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

        component.onSave();

        expect(mockedIosService.saveTemplate).toHaveBeenCalled();
    });
});

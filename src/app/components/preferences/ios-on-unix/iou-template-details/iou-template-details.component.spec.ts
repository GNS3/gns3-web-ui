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
import { IouTemplate } from '../../../../models/templates/iou-template';
import { IouTemplateDetailsComponent } from './iou-template-details.component';
import { IouService } from '../../../../services/iou.service';
import { IouConfigurationService } from '../../../../services/iou-configuration.service';

export class MockedIouService {
    public getTemplate(server: Server, template_id: string) {
        return of({} as IouTemplate);  
    }

    public saveTemplate(server: Server, iouTemplate: IouTemplate) {
        return of(iouTemplate);    
    }
}

describe('IouTemplateDetailsComponent', () => {
    let component: IouTemplateDetailsComponent;
    let fixture: ComponentFixture<IouTemplateDetailsComponent>;

    let mockedServerService = new MockedServerService;
    let mockedIouService = new MockedIouService;
    let mockedToasterService = new MockedToasterService;
    let activatedRoute = new MockedActivatedRoute().get();
    
    beforeEach(async(() => {
        TestBed.configureTestingModule({
          imports: [FormsModule, ReactiveFormsModule, MatIconModule, MatToolbarModule, MatMenuModule, MatCheckboxModule, CommonModule, NoopAnimationsModule, RouterTestingModule.withRoutes([])],
          providers: [
              { provide: ActivatedRoute,  useValue: activatedRoute },
              { provide: ServerService, useValue: mockedServerService },
              { provide: IouService, useValue: mockedIouService },
              { provide: ToasterService, useValue: mockedToasterService },
              { provide: IouConfigurationService, useClass: IouConfigurationService }
          ],
          declarations: [
              IouTemplateDetailsComponent
          ],
          schemas: [NO_ERRORS_SCHEMA]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(IouTemplateDetailsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call save template', () => {
        spyOn(mockedIouService, 'saveTemplate').and.returnValue(of({} as IouTemplate));

        component.onSave();

        expect(mockedIouService.saveTemplate).toHaveBeenCalled();
    });
});

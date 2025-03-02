import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { Controller } from '../../../../models/controller';
import { IouTemplate } from '../../../../models/templates/iou-template';
import { IouConfigurationService } from '../../../../services/iou-configuration.service';
import { IouService } from '../../../../services/iou.service';
import { ControllerService } from '../../../../services/controller.service';
import { MockedControllerService } from '../../../../services/controller.service.spec';
import { ToasterService } from '../../../../services/toaster.service';
import { MockedToasterService } from '../../../../services/toaster.service.spec';
import { MockedActivatedRoute } from '../../preferences.component.spec';
import { IouTemplateDetailsComponent } from './iou-template-details.component';

export class MockedIouService {
  public getTemplate(controller: Controller, template_id: string) {
    return of({} as IouTemplate);
  }

  public saveTemplate(controller: Controller, iouTemplate: IouTemplate) {
    return of(iouTemplate);
  }
}

describe('IouTemplateDetailsComponent', () => {
  let component: IouTemplateDetailsComponent;
  let fixture: ComponentFixture<IouTemplateDetailsComponent>;

  let mockedControllerService = new MockedControllerService();
  let mockedIouService = new MockedIouService();
  let mockedToasterService = new MockedToasterService();
  let activatedRoute = new MockedActivatedRoute().get();

  beforeEach(async() => {
   await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        ReactiveFormsModule,
        MatIconModule,
        MatToolbarModule,
        MatMenuModule,
        MatCheckboxModule,
        CommonModule,
        NoopAnimationsModule,
        RouterTestingModule.withRoutes([]),
      ],
      providers: [
        { provide: ActivatedRoute, useValue: activatedRoute },
        { provide: ControllerService, useValue: mockedControllerService },
        { provide: IouService, useValue: mockedIouService },
        { provide: ToasterService, useValue: mockedToasterService },
        { provide: IouConfigurationService, useClass: IouConfigurationService },
      ],
      declarations: [IouTemplateDetailsComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

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
    component.generalSettingsForm.controls['templateName'].setValue('template name');
    component.generalSettingsForm.controls['defaultName'].setValue('default name');
    component.generalSettingsForm.controls['symbol'].setValue('symbol');
    component.generalSettingsForm.controls['path'].setValue('path');
    component.generalSettingsForm.controls['initialConfig'].setValue('txt');
    component.networkForm.controls['ethernetAdapters'].setValue('1');
    component.networkForm.controls['serialAdapters'].setValue('1');

    component.onSave();

    expect(mockedIouService.saveTemplate).toHaveBeenCalled();
  });
});

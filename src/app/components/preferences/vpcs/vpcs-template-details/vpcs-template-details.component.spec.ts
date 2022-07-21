import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import{ Controller } from '../../../../models/controller';
import { VpcsTemplate } from '../../../../models/templates/vpcs-template';
import { ControllerService } from '../../../../services/controller.service';
import { MockedControllerService } from '../../../../services/controller.service.spec';
import { ToasterService } from '../../../../services/toaster.service';
import { MockedToasterService } from '../../../../services/toaster.service.spec';
import { VpcsConfigurationService } from '../../../../services/vpcs-configuration.service';
import { VpcsService } from '../../../../services/vpcs.service';
import { MockedActivatedRoute } from '../../preferences.component.spec';
import { VpcsTemplateDetailsComponent } from './vpcs-template-details.component';

export class MockedVpcsService {
  public getTemplate(controller:Controller , template_id: string) {
    return of({} as VpcsTemplate);
  }

  public saveTemplate(controller:Controller , vpcsTemplate: VpcsTemplate) {
    return of(vpcsTemplate);
  }
}

describe('VpcsTemplateDetailsComponent', () => {
  let component: VpcsTemplateDetailsComponent;
  let fixture: ComponentFixture<VpcsTemplateDetailsComponent>;

  let mockedServerService = new MockedControllerService();
  let mockedVpcsService = new MockedVpcsService();
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
        {
          provide: ActivatedRoute,
          useValue: activatedRoute,
        },
        { provide: ControllerService, useValue: mockedServerService },
        { provide: VpcsService, useValue: mockedVpcsService },
        { provide: ToasterService, useValue: mockedToasterService },
        { provide: VpcsConfigurationService, useClass: VpcsConfigurationService },
      ],
      declarations: [VpcsTemplateDetailsComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VpcsTemplateDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call save template', () => {
    spyOn(mockedVpcsService, 'saveTemplate').and.returnValue(of({} as VpcsTemplate));
    component.inputForm.controls['templateName'].setValue('template name');
    component.inputForm.controls['defaultName'].setValue('default name');
    component.inputForm.controls['scriptFile'].setValue('script file');
    component.inputForm.controls['symbol'].setValue('symbol');

    component.onSave();

    expect(mockedVpcsService.saveTemplate).toHaveBeenCalled();
  });

  it('should not call save template when template name is empty', () => {
    spyOn(mockedVpcsService, 'saveTemplate').and.returnValue(of({} as VpcsTemplate));
    component.inputForm.controls['templateName'].setValue('');
    component.inputForm.controls['defaultName'].setValue('default name');
    component.inputForm.controls['scriptFile'].setValue('script file');
    component.inputForm.controls['symbol'].setValue('symbol');

    component.onSave();

    expect(mockedVpcsService.saveTemplate).not.toHaveBeenCalled();
  });

  it('should not call save template when default name is empty', () => {
    spyOn(mockedVpcsService, 'saveTemplate').and.returnValue(of({} as VpcsTemplate));
    component.inputForm.controls['templateName'].setValue('template name');
    component.inputForm.controls['defaultName'].setValue('');
    component.inputForm.controls['scriptFile'].setValue('script file');
    component.inputForm.controls['symbol'].setValue('symbol');

    component.onSave();

    expect(mockedVpcsService.saveTemplate).not.toHaveBeenCalled();
  });

  it('should not call save template when script file is empty', () => {
    spyOn(mockedVpcsService, 'saveTemplate').and.returnValue(of({} as VpcsTemplate));
    component.inputForm.controls['templateName'].setValue('template name');
    component.inputForm.controls['defaultName'].setValue('default name');
    component.inputForm.controls['scriptFile'].setValue('');
    component.inputForm.controls['symbol'].setValue('symbol');

    component.onSave();

    expect(mockedVpcsService.saveTemplate).not.toHaveBeenCalled();
  });

  it('should not call save template when symbol path is empty', () => {
    spyOn(mockedVpcsService, 'saveTemplate').and.returnValue(of({} as VpcsTemplate));
    component.inputForm.controls['templateName'].setValue('template name');
    component.inputForm.controls['defaultName'].setValue('default name');
    component.inputForm.controls['scriptFile'].setValue('script file');
    component.inputForm.controls['symbol'].setValue('');

    component.onSave();

    expect(mockedVpcsService.saveTemplate).not.toHaveBeenCalled();
  });
});

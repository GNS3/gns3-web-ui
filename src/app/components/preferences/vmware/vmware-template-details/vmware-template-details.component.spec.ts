import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { Server } from '../../../../models/server';
import { VmwareTemplate } from '../../../../models/templates/vmware-template';
import { ServerService } from '../../../../services/server.service';
import { MockedServerService } from '../../../../services/server.service.spec';
import { ToasterService } from '../../../../services/toaster.service';
import { MockedToasterService } from '../../../../services/toaster.service.spec';
import { VmwareConfigurationService } from '../../../../services/vmware-configuration.service';
import { VmwareService } from '../../../../services/vmware.service';
import { MockedActivatedRoute } from '../../preferences.component.spec';
import { VmwareTemplateDetailsComponent } from './vmware-template-details.component';

export class MockedVmwareService {
  public getTemplate(server: Server, template_id: string) {
    return of({} as VmwareTemplate);
  }

  public saveTemplate(server: Server, vmwareTemplate: VmwareTemplate) {
    return of(vmwareTemplate);
  }
}

describe('VmwareTemplateDetailsComponent', () => {
  let component: VmwareTemplateDetailsComponent;
  let fixture: ComponentFixture<VmwareTemplateDetailsComponent>;

  let mockedServerService = new MockedServerService();
  let mockedVmwareService = new MockedVmwareService();
  let mockedToasterService = new MockedToasterService();
  let activatedRoute = new MockedActivatedRoute().get();

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        FormsModule,
        ReactiveFormsModule,
        MatTableModule,
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
        { provide: ServerService, useValue: mockedServerService },
        { provide: VmwareService, useValue: mockedVmwareService },
        { provide: ToasterService, useValue: mockedToasterService },
        { provide: VmwareConfigurationService, useClass: VmwareConfigurationService },
      ],
      declarations: [VmwareTemplateDetailsComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VmwareTemplateDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call save template', () => {
    spyOn(mockedVmwareService, 'saveTemplate').and.returnValue(of({} as VmwareTemplate));
    component.generalSettingsForm.controls['templateName'].setValue('template name');
    component.generalSettingsForm.controls['defaultName'].setValue('default name');
    component.generalSettingsForm.controls['symbol'].setValue('symbol');
    component.vmwareTemplate = {
      adapters: 0,
      custom_adapters: [],
    } as VmwareTemplate;

    component.onSave();

    expect(mockedVmwareService.saveTemplate).toHaveBeenCalled();
  });

  it('should not call save template when template name is empty', () => {
    spyOn(mockedVmwareService, 'saveTemplate').and.returnValue(of({} as VmwareTemplate));
    component.generalSettingsForm.controls['templateName'].setValue('');
    component.generalSettingsForm.controls['defaultName'].setValue('default name');
    component.generalSettingsForm.controls['symbol'].setValue('symbol');
    component.vmwareTemplate = {
      adapters: 0,
      custom_adapters: [],
    } as VmwareTemplate;

    component.onSave();

    expect(mockedVmwareService.saveTemplate).not.toHaveBeenCalled();
  });

  it('should not call save template when default name is empty', () => {
    spyOn(mockedVmwareService, 'saveTemplate').and.returnValue(of({} as VmwareTemplate));
    component.generalSettingsForm.controls['templateName'].setValue('template name');
    component.generalSettingsForm.controls['defaultName'].setValue('');
    component.generalSettingsForm.controls['symbol'].setValue('symbol');
    component.vmwareTemplate = {
      adapters: 0,
      custom_adapters: [],
    } as VmwareTemplate;

    component.onSave();

    expect(mockedVmwareService.saveTemplate).not.toHaveBeenCalled();
  });

  it('should not call save template when symbol path is empty', () => {
    spyOn(mockedVmwareService, 'saveTemplate').and.returnValue(of({} as VmwareTemplate));
    component.generalSettingsForm.controls['templateName'].setValue('template name');
    component.generalSettingsForm.controls['defaultName'].setValue('default name');
    component.generalSettingsForm.controls['symbol'].setValue('');
    component.vmwareTemplate = {
      adapters: 0,
      custom_adapters: [],
    } as VmwareTemplate;

    component.onSave();

    expect(mockedVmwareService.saveTemplate).not.toHaveBeenCalled();
  });
});

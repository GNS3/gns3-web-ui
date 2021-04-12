import { ComponentFixture, async, TestBed } from '@angular/core/testing';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { CommonModule } from '@angular/common';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { Observable, of } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MockedServerService } from '../../../../services/server.service.spec';
import { ServerService } from '../../../../services/server.service';
import { Server } from '../../../../models/server';
import { MockedToasterService } from '../../../../services/toaster.service.spec';
import { ToasterService } from '../../../../services/toaster.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MockedActivatedRoute } from '../../preferences.component.spec';
import { VmwareTemplate } from '../../../../models/templates/vmware-template';
import { VmwareTemplateDetailsComponent } from './vmware-template-details.component';
import { VmwareService } from '../../../../services/vmware.service';
import { VmwareConfigurationService } from '../../../../services/vmware-configuration.service';

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

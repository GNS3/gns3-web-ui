import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { AbstractControlDirective, FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
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
import { QemuTemplate } from '../../../../models/templates/qemu-template';
import { QemuConfigurationService } from '../../../../services/qemu-configuration.service';
import { QemuService } from '../../../../services/qemu.service';
import { ServerService } from '../../../../services/server.service';
import { MockedServerService } from '../../../../services/server.service.spec';
import { ToasterService } from '../../../../services/toaster.service';
import { MockedToasterService } from '../../../../services/toaster.service.spec';
import { MockedActivatedRoute } from '../../preferences.component.spec';
import { QemuVmTemplateDetailsComponent } from './qemu-vm-template-details.component';

export class MockedQemuService {
  public getTemplate(server: Server, template_id: string) {
    return of({} as QemuTemplate);
  }

  public saveTemplate(server: Server, qemuTemplate: QemuTemplate) {
    return of(qemuTemplate);
  }

  public getBinaries(server: Server) {
    return of([]);
  }

  public getImages(server: Server) {
    return of([]);
  }
}

describe('QemuVmTemplateDetailsComponent', () => {
  let component: QemuVmTemplateDetailsComponent;
  let fixture: ComponentFixture<QemuVmTemplateDetailsComponent>;

  let mockedServerService = new MockedServerService();
  let mockedQemuService = new MockedQemuService();
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
        { provide: ActivatedRoute, useValue: activatedRoute },
        { provide: ServerService, useValue: mockedServerService },
        { provide: QemuService, useValue: mockedQemuService },
        { provide: ToasterService, useValue: mockedToasterService },
        { provide: QemuConfigurationService, useClass: QemuConfigurationService },
        { provide: AbstractControlDirective, useExisting: FormControl, useMulti: true },
      ],
      declarations: [QemuVmTemplateDetailsComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(QemuVmTemplateDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call save template', () => {
    spyOn(mockedQemuService, 'saveTemplate').and.returnValue(of({} as QemuTemplate));
    component.generalSettingsForm.controls['templateName'].setValue('template name');
    component.generalSettingsForm.controls['defaultName'].setValue('default name');
    component.generalSettingsForm.controls['symbol'].setValue('symbol');
    component.qemuTemplate = {
      adapters: 0,
      custom_adapters: [],
    } as QemuTemplate;

    component.onSave();

    expect(mockedQemuService.saveTemplate).toHaveBeenCalled();
  });

  it('should not call save template when template name is empty', () => {
    spyOn(mockedQemuService, 'saveTemplate').and.returnValue(of({} as QemuTemplate));
    component.generalSettingsForm.controls['templateName'].setValue('');
    component.generalSettingsForm.controls['defaultName'].setValue('default name');
    component.generalSettingsForm.controls['symbol'].setValue('symbol');
    component.qemuTemplate = {
      adapters: 0,
      custom_adapters: [],
    } as QemuTemplate;

    component.onSave();

    expect(mockedQemuService.saveTemplate).not.toHaveBeenCalled();
  });

  it('should not call save template when default name is empty', () => {
    spyOn(mockedQemuService, 'saveTemplate').and.returnValue(of({} as QemuTemplate));
    component.generalSettingsForm.controls['templateName'].setValue('template name');
    component.generalSettingsForm.controls['defaultName'].setValue('');
    component.generalSettingsForm.controls['symbol'].setValue('symbol');
    component.qemuTemplate = {
      adapters: 0,
      custom_adapters: [],
    } as QemuTemplate;

    component.onSave();

    expect(mockedQemuService.saveTemplate).not.toHaveBeenCalled();
  });

  it('should call save template when symbol is empty', () => {
    spyOn(mockedQemuService, 'saveTemplate').and.returnValue(of({} as QemuTemplate));
    component.generalSettingsForm.controls['templateName'].setValue('template name');
    component.generalSettingsForm.controls['defaultName'].setValue('default name');
    component.generalSettingsForm.controls['symbol'].setValue('');
    component.qemuTemplate = {
      adapters: 0,
      custom_adapters: [],
    } as QemuTemplate;

    component.onSave();

    expect(mockedQemuService.saveTemplate).not.toHaveBeenCalled();
  });
});

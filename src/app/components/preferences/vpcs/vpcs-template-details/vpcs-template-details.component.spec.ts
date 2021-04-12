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
import { VpcsTemplateDetailsComponent } from './vpcs-template-details.component';
import { Server } from '../../../../models/server';
import { VpcsTemplate } from '../../../../models/templates/vpcs-template';
import { MockedToasterService } from '../../../../services/toaster.service.spec';
import { VpcsService } from '../../../../services/vpcs.service';
import { ToasterService } from '../../../../services/toaster.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MockedActivatedRoute } from '../../preferences.component.spec';
import { VpcsConfigurationService } from '../../../../services/vpcs-configuration.service';

export class MockedVpcsService {
  public getTemplate(server: Server, template_id: string) {
    return of({} as VpcsTemplate);
  }

  public saveTemplate(server: Server, vpcsTemplate: VpcsTemplate) {
    return of(vpcsTemplate);
  }
}

describe('VpcsTemplateDetailsComponent', () => {
  let component: VpcsTemplateDetailsComponent;
  let fixture: ComponentFixture<VpcsTemplateDetailsComponent>;

  let mockedServerService = new MockedServerService();
  let mockedVpcsService = new MockedVpcsService();
  let mockedToasterService = new MockedToasterService();
  let activatedRoute = new MockedActivatedRoute().get();

  beforeEach(async(() => {
    TestBed.configureTestingModule({
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
        { provide: ServerService, useValue: mockedServerService },
        { provide: VpcsService, useValue: mockedVpcsService },
        { provide: ToasterService, useValue: mockedToasterService },
        { provide: VpcsConfigurationService, useClass: VpcsConfigurationService },
      ],
      declarations: [VpcsTemplateDetailsComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

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

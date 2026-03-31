import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { Controller } from '@models/controller';
import { VpcsTemplate } from '@models/templates/vpcs-template';
import { TemplateService } from '@services/template.service';
import { ToasterService } from '@services/toaster.service';
import { MockedToasterService } from '@services/toaster.service.spec';
import { ControllerService } from '@services/controller.service';
import { MockedControllerService } from '@services/controller.service.spec';
import { VpcsService } from '@services/vpcs.service';
import { MockedActivatedRoute } from '../../preferences.component.spec';
import { VpcsTemplatesComponent } from './vpcs-templates.component';

export class MockedVpcsService {
  public getTemplates(controller: Controller) {
    return of([{} as VpcsTemplate]);
  }
}

class MockedTemplateService {
  deleteTemplate(controller: Controller, templateId: string) {
    return of({});
  }
}

describe('VpcsTemplatesComponent', () => {
  let component: VpcsTemplatesComponent;
  let fixture: ComponentFixture<VpcsTemplatesComponent>;

  let mockedControllerService = new MockedControllerService();
  let mockedVpcsService = new MockedVpcsService();
  let activatedRoute = new MockedActivatedRoute().get();

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        VpcsTemplatesComponent,
        MatIconModule,
        MatToolbarModule,
        MatMenuModule,
        MatCheckboxModule,
        CommonModule,
        NoopAnimationsModule,
        RouterTestingModule.withRoutes([]),
      ],
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: ActivatedRoute,
          useValue: activatedRoute,
        },
        { provide: ControllerService, useValue: mockedControllerService },
        { provide: VpcsService, useValue: mockedVpcsService },
        { provide: TemplateService, useClass: MockedTemplateService },
        { provide: ToasterService, useValue: new MockedToasterService() },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VpcsTemplatesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

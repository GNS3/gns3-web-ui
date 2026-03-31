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
import { VirtualBoxTemplate } from '@models/templates/virtualbox-template';
import { TemplateService } from '@services/template.service';
import { ToasterService } from '@services/toaster.service';
import { MockedToasterService } from '@services/toaster.service.spec';
import { ControllerService } from '@services/controller.service';
import { MockedControllerService } from '@services/controller.service.spec';
import { VirtualBoxService } from '@services/virtual-box.service';
import { MockedActivatedRoute } from '../../preferences.component.spec';
import { VirtualBoxTemplatesComponent } from './virtual-box-templates.component';

export class MockedVirtualBoxService {
  public getTemplates(controller: Controller) {
    return of([{} as VirtualBoxTemplate]);
  }
}

class MockedTemplateService {
  deleteTemplate(controller: Controller, templateId: string) {
    return of({});
  }
}

describe('VirtualBoxTemplatesComponent', () => {
  let component: VirtualBoxTemplatesComponent;
  let fixture: ComponentFixture<VirtualBoxTemplatesComponent>;

  let mockedControllerService = new MockedControllerService();
  let mockedVirtualBoxService = new MockedVirtualBoxService();
  let activatedRoute = new MockedActivatedRoute().get();

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        VirtualBoxTemplatesComponent,
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
        { provide: VirtualBoxService, useValue: mockedVirtualBoxService },
        { provide: TemplateService, useClass: MockedTemplateService },
        { provide: ToasterService, useValue: new MockedToasterService() },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VirtualBoxTemplatesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

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
import { IosTemplate } from '@models/templates/ios-template';
import { IosService } from '@services/ios.service';
import { TemplateService } from '@services/template.service';
import { ToasterService } from '@services/toaster.service';
import { MockedToasterService } from '@services/toaster.service.spec';
import { ControllerService } from '@services/controller.service';
import { MockedControllerService } from '@services/controller.service.spec';
import { MockedActivatedRoute } from '../../preferences.component.spec';
import { IosTemplatesComponent } from './ios-templates.component';

export class MockedIosService {
  public getTemplates(controller: Controller) {
    return of([{} as IosTemplate]);
  }
}

class MockedTemplateService {
  deleteTemplate(controller: Controller, templateId: string) {
    return of({});
  }
}

describe('IosTemplatesComponent', () => {
  let component: IosTemplatesComponent;
  let fixture: ComponentFixture<IosTemplatesComponent>;

  let mockedControllerService = new MockedControllerService();
  let mockedIosService = new MockedIosService();
  let activatedRoute = new MockedActivatedRoute().get();

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        IosTemplatesComponent,
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
        { provide: IosService, useValue: mockedIosService },
        { provide: TemplateService, useClass: MockedTemplateService },
        { provide: ToasterService, useValue: new MockedToasterService() },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IosTemplatesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

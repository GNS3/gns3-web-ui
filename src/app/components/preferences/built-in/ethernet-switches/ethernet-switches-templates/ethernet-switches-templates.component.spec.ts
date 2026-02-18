import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
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
import { EthernetSwitchTemplate } from '@models/templates/ethernet-switch-template';
import { BuiltInTemplatesService } from '@services/built-in-templates.service';
import { ControllerService } from '@services/controller.service';
import { MockedControllerService } from '@services/controller.service.spec';
import { MockedActivatedRoute } from '../../../preferences.component.spec';
import { EthernetSwitchesTemplatesComponent } from './ethernet-switches-templates.component';

export class MockedBuiltInTemplatesService {
  public getTemplates(controller: Controller ) {
    return of([{} as EthernetSwitchTemplate]);
  }
}

describe('EthernetSwitchesTemplatesComponent', () => {
  let component: EthernetSwitchesTemplatesComponent;
  let fixture: ComponentFixture<EthernetSwitchesTemplatesComponent>;

  let mockedControllerService = new MockedControllerService();
  let mockedBuiltInTemplatesService = new MockedBuiltInTemplatesService();
  let activatedRoute = new MockedActivatedRoute().get();

  beforeEach(async () => {
   await TestBed.configureTestingModule({
      imports: [
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
        { provide: ControllerService, useValue: mockedControllerService },
        { provide: BuiltInTemplatesService, useValue: mockedBuiltInTemplatesService },
      ],
      declarations: [EthernetSwitchesTemplatesComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

beforeEach(() => {
  fixture = TestBed.createComponent(EthernetSwitchesTemplatesComponent);
  component = fixture.componentInstance;
  fixture.detectChanges();
});

it('should create', () => {
  expect(component).toBeTruthy();
});
});

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
import { VmwareTemplate } from '@models/templates/vmware-template';
import { ControllerService } from '@services/controller.service';
import { MockedControllerService } from '@services/controller.service.spec';
import { VmwareService } from '@services/vmware.service';
import { MockedActivatedRoute } from '../../preferences.component.spec';
import { VmwareTemplatesComponent } from './vmware-templates.component';

export class MockedVmwareService {
  public getTemplates(controller: Controller ) {
    return of([{} as VmwareTemplate]);
  }
}

describe('VmwareTemplatesComponent', () => {
  let component: VmwareTemplatesComponent;
  let fixture: ComponentFixture<VmwareTemplatesComponent>;

  let mockedControllerService = new MockedControllerService();
  let mockedVmwareService = new MockedVmwareService();
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
        { provide: VmwareService, useValue: mockedVmwareService },
      ],
      declarations: [VmwareTemplatesComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

beforeEach(() => {
  fixture = TestBed.createComponent(VmwareTemplatesComponent);
  component = fixture.componentInstance;
  fixture.detectChanges();
});

it('should create', () => {
  expect(component).toBeTruthy();
});
});

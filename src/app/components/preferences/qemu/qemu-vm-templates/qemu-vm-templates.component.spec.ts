import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { Controller } from '../../../../models/controller';
import { QemuTemplate } from '../../../../models/templates/qemu-template';
import { QemuService } from '../../../../services/qemu.service';
import { ControllerService } from '../../../../services/controller.service';
import { MockedControllerService } from '../../../../services/controller.service.spec';
import { MockedActivatedRoute } from '../../preferences.component.spec';
import { QemuVmTemplatesComponent } from './qemu-vm-templates.component';

export class MockedQemuService {
  public getTemplates(controller:Controller ) {
    return of([{} as QemuTemplate]);
  }
}

describe('QemuTemplatesComponent', () => {
  let component: QemuVmTemplatesComponent;
  let fixture: ComponentFixture<QemuVmTemplatesComponent>;

  let mockedControllerService = new MockedControllerService();
  let mockedQemuService = new MockedQemuService();
  let activatedRoute = new MockedActivatedRoute().get();

  beforeEach(async() => {
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
        { provide: QemuService, useValue: mockedQemuService },
      ],
      declarations: [QemuVmTemplatesComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(QemuVmTemplatesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

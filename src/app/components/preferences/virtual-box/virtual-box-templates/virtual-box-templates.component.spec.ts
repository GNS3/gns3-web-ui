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
import { Controller } from '../../../../models/controller';
import { VirtualBoxTemplate } from '../../../../models/templates/virtualbox-template';
import { ControllerService } from '../../../../services/controller.service';
import { MockedControllerService } from '../../../../services/controller.service.spec';
import { VirtualBoxService } from '../../../../services/virtual-box.service';
import { MockedActivatedRoute } from '../../preferences.component.spec';
import { VirtualBoxTemplatesComponent } from './virtual-box-templates.component';

export class MockedVirtualBoxService {
  public getTemplates(controller:Controller ) {
    return of([{} as VirtualBoxTemplate]);
  }
}

describe('VirtualBoxTemplatesComponent', () => {
  let component: VirtualBoxTemplatesComponent;
  let fixture: ComponentFixture<VirtualBoxTemplatesComponent>;

  let mockedControllerService = new MockedControllerService();
  let mockedVirtualBoxService = new MockedVirtualBoxService();
  let activatedRoute = new MockedActivatedRoute().get();

  beforeEach(async() => {
  await  TestBed.configureTestingModule({
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
        { provide: VirtualBoxService, useValue: mockedVirtualBoxService },
      ],
      declarations: [VirtualBoxTemplatesComponent],
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

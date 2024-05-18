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
import { IouTemplate } from '../../../../models/templates/iou-template';
import { IouService } from '../../../../services/iou.service';
import { ControllerService } from '../../../../services/controller.service';
import { MockedControllerService } from '../../../../services/controller.service.spec';
import { MockedActivatedRoute } from '../../preferences.component.spec';
import { IouTemplatesComponent } from './iou-templates.component';

export class MockedIouService {
  public getTemplates(controller:Controller ) {
    return of([{} as IouTemplate]);
  }
}

describe('IouTemplatesComponent', () => {
  let component: IouTemplatesComponent;
  let fixture: ComponentFixture<IouTemplatesComponent>;

  let mockedControllerService = new MockedControllerService();
  let mockedIouService = new MockedIouService();
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
        { provide: ActivatedRoute, useValue: activatedRoute },
        { provide: ControllerService, useValue: mockedControllerService },
        { provide: IouService, useValue: mockedIouService },
      ],
      declarations: [IouTemplatesComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IouTemplatesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

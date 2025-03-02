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
import { IosTemplate } from '../../../../models/templates/ios-template';
import { IosService } from '../../../../services/ios.service';
import { ControllerService } from '../../../../services/controller.service';
import { MockedControllerService } from '../../../../services/controller.service.spec';
import { MockedActivatedRoute } from '../../preferences.component.spec';
import { IosTemplatesComponent } from './ios-templates.component';

export class MockedIosService {
  public getTemplates(controller: Controller ) {
    return of([{} as IosTemplate]);
  }
}

describe('IosTemplatesComponent', () => {
  let component: IosTemplatesComponent;
  let fixture: ComponentFixture<IosTemplatesComponent>;

  let mockedControllerService = new MockedControllerService();
  let mockedIosService = new MockedIosService();
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
        { provide: IosService, useValue: mockedIosService },
      ],
      declarations: [IosTemplatesComponent],
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

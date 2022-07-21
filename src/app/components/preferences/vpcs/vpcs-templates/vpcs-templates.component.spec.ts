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
import{ Controller } from '../../../../models/controller';
import { VpcsTemplate } from '../../../../models/templates/vpcs-template';
import { ControllerService } from '../../../../services/controller.service';
import { MockedServerService } from '../../../../services/controller.service.spec';
import { VpcsService } from '../../../../services/vpcs.service';
import { MockedActivatedRoute } from '../../preferences.component.spec';
import { VpcsTemplatesComponent } from './vpcs-templates.component';

export class MockedVpcsService {
  public getTemplates(controller:Controller ) {
    return of([{} as VpcsTemplate]);
  }
}

describe('VpcsTemplatesComponent', () => {
  let component: VpcsTemplatesComponent;
  let fixture: ComponentFixture<VpcsTemplatesComponent>;

  let mockedServerService = new MockedServerService();
  let mockedVpcsService = new MockedVpcsService();
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
        { provide: ControllerService, useValue: mockedServerService },
        { provide: VpcsService, useValue: mockedVpcsService },
      ],
      declarations: [VpcsTemplatesComponent],
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

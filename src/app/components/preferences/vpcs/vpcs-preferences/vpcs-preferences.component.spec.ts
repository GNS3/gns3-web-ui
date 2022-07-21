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
import { ControllerService } from '../../../../services/controller.service';
import { MockedServerService } from '../../../../services/controller.service.spec';
import { MockedActivatedRoute } from '../../preferences.component.spec';
import { VpcsPreferencesComponent } from './vpcs-preferences.component';

describe('VpcsPreferencesComponent', () => {
  let component: VpcsPreferencesComponent;
  let fixture: ComponentFixture<VpcsPreferencesComponent>;

  let mockedServerService = new MockedServerService();
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
      ],
      declarations: [VpcsPreferencesComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VpcsPreferencesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should clear path to executable', () => {
    component.restoreDefaults();

    expect(component.vpcsExecutable).toBe('');
  });
});

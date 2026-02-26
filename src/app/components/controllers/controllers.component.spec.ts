import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ControllerDatabase } from '@services/controller.database';
import { ControllerService } from '@services/controller.service';
import { MockedControllerService } from 'app/services/controller.service.spec';
import { ControllersComponent } from './controllers.component';
import { ControllerManagementService } from '@services/controller-management.service';
import { ElectronService } from 'ngx-electron';
import { ChildProcessService } from 'ngx-childprocess';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { ActivatedRoute, Router } from '@angular/router';
import { MockedActivatedRoute } from '../snapshots/list-of-snapshots/list-of-snaphshots.component.spec';
import { RouterTestingModule } from '@angular/router/testing';
import { ChangeDetectorRef } from '@angular/core';
import { MockedRouter } from 'app/common/progress/progress.component.spec';
import { of } from 'rxjs';

describe('ControllersComponent', () => {
  let component: ControllersComponent;
  let fixture: ComponentFixture<ControllersComponent>;
  let controllerMockedService: MockedControllerService
  let mockedActivatedRoute: MockedActivatedRoute
  let mockedRouter: MockedRouter
  let mockedControllerManagementService: any;

  beforeEach(async () => {
    controllerMockedService = new MockedControllerService();
    // Add missing properties that the component expects
    controllerMockedService['isServiceInitialized'] = true;
    controllerMockedService['serviceInitialized'] = of(true);
    controllerMockedService['checkControllerVersion'] = jasmine.createSpy('checkControllerVersion').and.returnValue(of({ version: '3.0.0' }));
    controllerMockedService['delete'] = jasmine.createSpy('delete').and.returnValue(Promise.resolve());

    mockedActivatedRoute = new MockedActivatedRoute();
    mockedRouter = new MockedRouter();

    // Mock ControllerManagementService
    mockedControllerManagementService = {
      getRunningControllers: jasmine.createSpy('getRunningControllers').and.returnValue([]),
      controllerStatusChanged: of({}),
      start: jasmine.createSpy('start').and.returnValue(Promise.resolve()),
      stop: jasmine.createSpy('stop').and.returnValue(Promise.resolve())
    };

    await TestBed.configureTestingModule({
      declarations: [ControllersComponent],
      imports: [
        MatDialogModule,
        RouterTestingModule,
        MatBottomSheetModule
      ],
      providers: [
        MatDialog,
        ControllerDatabase,
        ElectronService,
        MatBottomSheet,
        ChildProcessService,
        ChangeDetectorRef,
        { provide: ControllerService, useValue: controllerMockedService },
        { provide: ControllerManagementService, useValue: mockedControllerManagementService },
        { provide: ActivatedRoute, useValue: mockedActivatedRoute },
        { provide: Router, useValue: mockedRouter },
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ControllersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });
  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ControllerDatabase } from '../../services/controller.database';
import { ControllerService } from '../../services/controller.service';
import { MockedControllerService } from 'app/services/controller.service.spec';
import { ControllersComponent } from './controllers.component';
import { ControllerManagementService } from '../../services/controller-management.service';
import { ElectronService } from 'ngx-electron';
import { ChildProcessService } from 'ngx-childprocess';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { ActivatedRoute, Router } from '@angular/router';
import { MockedActivatedRoute } from '../snapshots/list-of-snapshots/list-of-snaphshots.component.spec';
import { RouterTestingModule } from '@angular/router/testing';
import { ChangeDetectorRef } from '@angular/core';
import { MockedRouter } from 'app/common/progress/progress.component.spec';

describe('ControllersComponent', () => {
  let component: ControllersComponent;
  let fixture: ComponentFixture<ControllersComponent>;
  let controllerMockedService: MockedControllerService
  let mockedActivatedRoute: MockedActivatedRoute
  let mockedRouter  : MockedRouter

  beforeEach(async () => {
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
        ControllerManagementService,
        ElectronService,
        MatBottomSheet,
        ChildProcessService,
        ChangeDetectorRef,
        { provide: ControllerService, useValue: controllerMockedService },
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

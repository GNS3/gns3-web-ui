import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ServerDatabase } from '../../services/server.database';
import { ServerService } from '../../services/server.service';
import { MockedServerService } from 'app/services/server.service.spec';
import { ControllersComponent } from './controllers.component';
import { ServerManagementService } from 'app/services/server-management.service';
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
  let serverMockedService: MockedServerService
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
        ServerDatabase,
        ServerManagementService,
        ElectronService,
        MatBottomSheet,
        ChildProcessService,
        ChangeDetectorRef,
        { provide: ServerService, useValue: serverMockedService },
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

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ServerDatabase } from '../../services/server.database';
import { ServerService } from '../../services/server.service';
import { MockedServerService } from 'app/services/server.service.spec';
import { ServersComponent } from './servers.component';
import { ServerManagementService } from 'app/services/server-management.service';
import { ElectronService } from 'ngx-electron';
import { ChildProcessService } from 'ngx-childprocess';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { ActivatedRoute, Router } from '@angular/router';
import { MockedActivatedRoute } from '../snapshots/list-of-snapshots/list-of-snaphshots.component.spec';
import { RouterTestingModule } from '@angular/router/testing';
import { ChangeDetectorRef } from '@angular/core';

describe('ServersComponent', () => {
  let component: ServersComponent;
  let fixture: ComponentFixture<ServersComponent>;
  let serverMockedService: MockedServerService
  let mockedActivatedRoute: MockedActivatedRoute

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ServersComponent],
      imports: [
        MatDialogModule,
        RouterTestingModule,
        MatBottomSheetModule
      ],
      providers: [
        MatDialog,
        { provide: ServerService, useValue: serverMockedService },
        { provide: ActivatedRoute, useValue:mockedActivatedRoute  },
        ServerDatabase,
        ServerManagementService,
        ElectronService,
        MatBottomSheet,
        Router,
        ChildProcessService,
        ChangeDetectorRef
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ServersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });
  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

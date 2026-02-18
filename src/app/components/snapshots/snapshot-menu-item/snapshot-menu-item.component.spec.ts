import { Overlay, ScrollStrategyOptions } from '@angular/cdk/overlay';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { Context } from 'app/cartography/models/context';
import { ProgressDialogService } from 'app/common/progress-dialog/progress-dialog.service';
import { HttpController, ControllerErrorHandler } from 'app/services/http-controller.service';
import { SnapshotService } from 'app/services/snapshot.service';
import { ToasterService } from 'app/services/toaster.service';
import { SnapshotMenuItemComponent } from './snapshot-menu-item.component';

describe('SnapshotMenuItemComponent', () => {
  let component: SnapshotMenuItemComponent;
  let fixture: ComponentFixture<SnapshotMenuItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SnapshotMenuItemComponent],
      imports:[MatDialogModule,HttpClientModule,MatSnackBarModule],
      providers: [
        SnapshotService,
        MatDialog,
        HttpController,
        Overlay,
        ScrollStrategyOptions,
        HttpClient,
        ControllerErrorHandler,
        ProgressDialogService,
        Context,
        ToasterService
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SnapshotMenuItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

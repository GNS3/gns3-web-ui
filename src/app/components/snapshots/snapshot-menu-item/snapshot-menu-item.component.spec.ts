import { HttpClientTestingModule } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ProgressDialogService } from 'app/common/progress-dialog/progress-dialog.service';
import { HttpController } from 'app/services/http-controller.service';
import { SnapshotService } from 'app/services/snapshot.service';
import { ToasterService } from 'app/services/toaster.service';
import { AppTestingModule } from 'app/testing/app-testing/app-testing.module';
import { SnapshotMenuItemComponent } from './snapshot-menu-item.component';
import { MatIconModule } from '@angular/material/icon';

describe('SnapshotMenuItemComponent', () => {
  let component: SnapshotMenuItemComponent;
  let fixture: ComponentFixture<SnapshotMenuItemComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SnapshotMenuItemComponent],
      imports: [
        MatDialogModule,
        MatIconModule,
        HttpClientTestingModule,
        MatSnackBarModule,
        NoopAnimationsModule,
        AppTestingModule,
      ],
      providers: [
        provideZonelessChangeDetection(),
        SnapshotService,
        HttpController,
        ProgressDialogService,
        ToasterService,
      ],
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

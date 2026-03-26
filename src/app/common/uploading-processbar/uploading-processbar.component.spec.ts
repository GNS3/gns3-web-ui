import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { MatSnackBarModule, MatSnackBarRef, MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { UploadServiceService } from './upload-service.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { UploadingProcessbarComponent } from './uploading-processbar.component';
import { MatProgressBarModule } from '@angular/material/progress-bar';

describe('UploadingProcessbarComponent', () => {
  let component: UploadingProcessbarComponent;
  let fixture: ComponentFixture<UploadingProcessbarComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [UploadingProcessbarComponent],
      imports: [MatSnackBarModule, MatProgressBarModule, MatButtonModule],
      providers: [
        provideZonelessChangeDetection(),
        { provide: MAT_SNACK_BAR_DATA, useValue: {} },
        { provide: MatSnackBarRef, useValue: {} },
        { provide: UploadServiceService, useClass: UploadServiceService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UploadingProcessbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

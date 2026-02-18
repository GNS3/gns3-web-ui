import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';

import { ProjectMapLockConfirmationDialogComponent } from './project-map-lock-confirmation-dialog.component';

describe('ProjectMapLockConfirmationDialogComponent', () => {
  let component: ProjectMapLockConfirmationDialogComponent;
  let fixture: ComponentFixture<ProjectMapLockConfirmationDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports:[
        MatIconModule,
        MatToolbarModule,
        MatMenuModule,
        MatCheckboxModule,
        MatDialogModule,
        MatSnackBarModule,
      ],
      providers: [
       
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: MatDialogRef, useValue: {} },
      ],
      declarations: [ ProjectMapLockConfirmationDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectMapLockConfirmationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

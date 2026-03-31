import { provideZonelessChangeDetection, ChangeDetectorRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { UserService } from '@services/user.service';
import { ProgressService } from 'app/common/progress/progress.service';
import { ControllerService } from '@services/controller.service';
import { ToasterService } from '@services/toaster.service';
import { UserManagementComponent } from './user-management.component';

describe('UserManagementComponent', () => {
  let component: UserManagementComponent;
  let fixture: ComponentFixture<UserManagementComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [UserManagementComponent],
      providers: [
        provideZonelessChangeDetection(),
        ChangeDetectorRef,
        { provide: ActivatedRoute, useValue: {} },
        { provide: UserService, useValue: {} },
        { provide: ProgressService, useValue: {} },
        { provide: ControllerService, useValue: {} },
        { provide: MatDialog, useValue: {} },
        { provide: ToasterService, useValue: {} },
        { provide: Location, useValue: {} },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UserManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

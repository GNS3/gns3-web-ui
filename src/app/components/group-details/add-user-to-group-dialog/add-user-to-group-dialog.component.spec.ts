import { provideZonelessChangeDetection, ChangeDetectorRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { UserService } from '@services/user.service';
import { GroupService } from '@services/group.service';
import { ToasterService } from '@services/toaster.service';
import { AddUserToGroupDialogComponent } from './add-user-to-group-dialog.component';

describe('AddUserToGroupDialogComponent', () => {
  let component: AddUserToGroupDialogComponent;
  let fixture: ComponentFixture<AddUserToGroupDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        ChangeDetectorRef,
        { provide: MatDialogRef, useValue: {} },
        { provide: UserService, useValue: {} },
        { provide: GroupService, useValue: {} },
        { provide: ToasterService, useValue: {} },
      ],
      imports: [AddUserToGroupDialogComponent],
    });
    fixture = TestBed.createComponent(AddUserToGroupDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

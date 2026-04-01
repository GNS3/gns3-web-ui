import { provideZonelessChangeDetection, ChangeDetectorRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntypedFormBuilder } from '@angular/forms';
import { GroupService } from '@services/group.service';
import { UserService } from '@services/user.service';
import { ToasterService } from '@services/toaster.service';
import { AddGroupDialogComponent } from './add-group-dialog.component';

describe('AddGroupDialogComponent', () => {
  let component: AddGroupDialogComponent;
  let fixture: ComponentFixture<AddGroupDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        ChangeDetectorRef,
        { provide: MatDialogRef, useValue: {} },
        { provide: MAT_DIALOG_DATA, useValue: { controller: {} } },
        UntypedFormBuilder,
        { provide: GroupService, useValue: {} },
        { provide: UserService, useValue: {} },
        { provide: ToasterService, useValue: {} },
      ],
      imports: [AddGroupDialogComponent],
    });
    fixture = TestBed.createComponent(AddGroupDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

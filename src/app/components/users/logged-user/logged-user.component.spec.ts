import { provideZonelessChangeDetection, ChangeDetectorRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { LoggedUserComponent } from './logged-user.component';
import { ControllerService } from '@services/controller.service';
import { UserService } from '@services/user.service';
import { ToasterService } from '@services/toaster.service';

describe('LoggedUserComponent', () => {
  let component: LoggedUserComponent;
  let fixture: ComponentFixture<LoggedUserComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [LoggedUserComponent],
      providers: [
        provideZonelessChangeDetection(),
        ChangeDetectorRef,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => '1'
              }
            }
          }
        },
        { provide: ControllerService, useValue: {} },
        { provide: UserService, useValue: {} },
        { provide: ToasterService, useValue: {} },
        { provide: MatDialog, useValue: {} },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LoggedUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

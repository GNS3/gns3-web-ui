import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RoleManagementComponent } from './role-management.component';

describe('RoleManagementComponent', () => {
  let component: RoleManagementComponent;
  let fixture: ComponentFixture<RoleManagementComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RoleManagementComponent],
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => null
              }
            }
          }
        },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RoleManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

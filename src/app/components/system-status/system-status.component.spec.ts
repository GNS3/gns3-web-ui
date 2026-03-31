import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { SystemStatusComponent } from './system-status.component';

describe('SystemStatusComponent', () => {
  let component: SystemStatusComponent;
  let fixture: ComponentFixture<SystemStatusComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SystemStatusComponent],
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
    fixture = TestBed.createComponent(SystemStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

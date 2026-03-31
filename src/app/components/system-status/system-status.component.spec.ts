import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SystemStatusComponent } from './system-status.component';

describe('SystemStatusComponent', () => {
  let component: SystemStatusComponent;
  let fixture: ComponentFixture<SystemStatusComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SystemStatusComponent],
      providers: [provideZonelessChangeDetection()],
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

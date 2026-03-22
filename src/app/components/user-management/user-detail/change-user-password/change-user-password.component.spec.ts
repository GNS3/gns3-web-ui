import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangeUserPasswordComponent } from './change-user-password.component';

describe('ChangeUserPasswordComponent', () => {
  let component: ChangeUserPasswordComponent;
  let fixture: ComponentFixture<ChangeUserPasswordComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ChangeUserPasswordComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ChangeUserPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

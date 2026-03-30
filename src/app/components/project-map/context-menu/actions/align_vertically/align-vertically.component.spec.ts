import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AlignVerticallyComponent } from './align-vertically.component';

describe('AlignVerticallyComponent', () => {
  let component: AlignVerticallyComponent;
  let fixture: ComponentFixture<AlignVerticallyComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      declarations: [AlignVerticallyComponent],
    });
    fixture = TestBed.createComponent(AlignVerticallyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

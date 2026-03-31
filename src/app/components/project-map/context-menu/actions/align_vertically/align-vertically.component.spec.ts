import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AlignVerticallyActionComponent } from './align-vertically.component';

describe('AlignVerticallyActionComponent', () => {
  let component: AlignVerticallyActionComponent;
  let fixture: ComponentFixture<AlignVerticallyActionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      imports: [AlignVerticallyActionComponent],
    });
    fixture = TestBed.createComponent(AlignVerticallyActionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

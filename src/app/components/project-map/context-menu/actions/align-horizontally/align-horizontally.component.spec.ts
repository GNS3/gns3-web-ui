import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AlignHorizontallyComponent } from './align-horizontally.component';

describe('AlignHorizontallyComponent', () => {
  let component: AlignHorizontallyComponent;
  let fixture: ComponentFixture<AlignHorizontallyComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      declarations: [AlignHorizontallyComponent],
    });
    fixture = TestBed.createComponent(AlignHorizontallyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

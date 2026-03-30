import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AlignHorizontallyActionComponent } from './align-horizontally.component';

describe('AlignHorizontallyActionComponent', () => {
  let component: AlignHorizontallyActionComponent;
  let fixture: ComponentFixture<AlignHorizontallyActionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      declarations: [AlignHorizontallyActionComponent],
    });
    fixture = TestBed.createComponent(AlignHorizontallyActionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

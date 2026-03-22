import { ComponentFixture, TestBed, provideZonelessChangeDetection } from '@angular/core';
import { StatusComponent } from './status.component';

describe('StatusComponent', () => {
  let component: StatusComponent;
  let fixture: ComponentFixture<StatusComponent>;

  beforeEach(() => {
   TestBed.configureTestingModule({
      declarations: [StatusComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

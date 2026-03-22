import { ComponentFixture, TestBed, provideZonelessChangeDetection } from '@angular/core';
import { DraggableComponent } from './draggable.component';

describe('DraggableComponent', () => {
  let component: DraggableComponent;
  let fixture: ComponentFixture<DraggableComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DraggableComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DraggableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

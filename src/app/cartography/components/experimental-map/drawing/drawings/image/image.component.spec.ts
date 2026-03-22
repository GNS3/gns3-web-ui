import { ComponentFixture, TestBed, provideZonelessChangeDetection } from '@angular/core';
import { ImageComponent } from './image.component';

describe('ImageComponent', () => {
  let component: ImageComponent;
  let fixture: ComponentFixture<ImageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ImageComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ImageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

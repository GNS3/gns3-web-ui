import { ComponentFixture, TestBed, provideZonelessChangeDetection } from '@angular/core/testing';
import { ExperimentalMapComponent } from './experimental-map.component';

describe('ExperimentalMapComponent', () => {
  let component: ExperimentalMapComponent;
  let fixture: ComponentFixture<ExperimentalMapComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      declarations: [ExperimentalMapComponent],
    });
    fixture = TestBed.createComponent(ExperimentalMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
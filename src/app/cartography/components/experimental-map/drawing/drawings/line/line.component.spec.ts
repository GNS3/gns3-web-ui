import { ComponentFixture, TestBed, provideZonelessChangeDetection } from '@angular/core';
import { QtDasharrayFixer } from 'app/cartography/helpers/qt-dasharray-fixer';
import { LineComponent } from './line.component';

describe('LineComponent', () => {
  let component: LineComponent;
  let fixture: ComponentFixture<LineComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [LineComponent],
      providers: [provideZonelessChangeDetection(), QtDasharrayFixer],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

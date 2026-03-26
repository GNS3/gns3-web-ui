import { ComponentFixture, TestBed, provideZonelessChangeDetection } from '@angular/core';
import { D3MapComponent } from './d3-map.component';

describe('D3MapComponent', () => {
  let component: D3MapComponent;
  let fixture: ComponentFixture<D3MapComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [D3MapComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  it('should create', () => {
    expect(component);
  });
});

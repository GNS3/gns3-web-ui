import {ComponentFixture, TestBed, provideZonelessChangeDetection } from '@angular/core';
import { QtDasharrayFixer } from 'app/cartography/helpers/qt-dasharray-fixer';
import { RectComponent } from './rect.component';

describe('RectComponent', () => {
  let component: RectComponent;
  let fixture: ComponentFixture<RectComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RectComponent],
      providers:[provideZonelessChangeDetection(), QtDasharrayFixer]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

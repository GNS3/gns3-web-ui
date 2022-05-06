import {ComponentFixture, TestBed } from '@angular/core/testing';
import { QtDasharrayFixer } from 'app/cartography/helpers/qt-dasharray-fixer';
import { RectComponent } from './rect.component';

describe('RectComponent', () => {
  let component: RectComponent;
  let fixture: ComponentFixture<RectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RectComponent],
      providers:[QtDasharrayFixer]
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

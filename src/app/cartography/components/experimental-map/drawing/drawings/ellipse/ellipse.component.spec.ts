import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QtDasharrayFixer } from 'app/cartography/helpers/qt-dasharray-fixer';
import { EllipseComponent } from './ellipse.component';

describe('EllipseComponent', () => {
  let component: EllipseComponent;
  let fixture: ComponentFixture<EllipseComponent>;

  beforeEach(async() => {
   await TestBed.configureTestingModule({
      declarations: [EllipseComponent],
      providers:[QtDasharrayFixer]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EllipseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EllipseComponent } from './ellipse.component';

describe('EllipseComponent', () => {
  let component: EllipseComponent;
  let fixture: ComponentFixture<EllipseComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [EllipseComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EllipseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // it('should create', () => {
  //   expect(component).toBeTruthy();
  // });
});

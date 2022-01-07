import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MethodButtonComponent } from './method-button.component';

describe('MethodButtonComponent', () => {
  let component: MethodButtonComponent;
  let fixture: ComponentFixture<MethodButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MethodButtonComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MethodButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

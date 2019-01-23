import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InterfaceLabelComponent } from './interface-label.component';

describe('InterfaceLabelComponent', () => {
  let component: InterfaceLabelComponent;
  let fixture: ComponentFixture<InterfaceLabelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [InterfaceLabelComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InterfaceLabelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // it('should create', () => {
  //   expect(component).toBeTruthy();
  // });
});

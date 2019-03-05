import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsoleDeviceActionComponent } from './console-device-action.component';

describe('ConsoleDeviceActionComponent', () => {
  let component: ConsoleDeviceActionComponent;
  let fixture: ComponentFixture<ConsoleDeviceActionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ConsoleDeviceActionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConsoleDeviceActionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

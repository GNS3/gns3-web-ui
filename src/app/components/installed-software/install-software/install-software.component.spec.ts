import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InstallSoftwareComponent } from './install-software.component';

describe('InstallSoftwareComponent', () => {
  let component: InstallSoftwareComponent;
  let fixture: ComponentFixture<InstallSoftwareComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [InstallSoftwareComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InstallSoftwareComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // it('should create', () => {
  //   expect(component).toBeTruthy();
  // });
});

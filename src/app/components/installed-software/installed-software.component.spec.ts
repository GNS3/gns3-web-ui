import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InstalledSoftwareComponent } from './installed-software.component';

describe('InstalledSoftwareComponent', () => {
  let component: InstalledSoftwareComponent;
  let fixture: ComponentFixture<InstalledSoftwareComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InstalledSoftwareComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InstalledSoftwareComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

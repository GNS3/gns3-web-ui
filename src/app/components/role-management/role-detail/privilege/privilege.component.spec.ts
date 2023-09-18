import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrivilegeComponent } from './privilege.component';

describe('PrivilegeComponent', () => {
  let component: PrivilegeComponent;
  let fixture: ComponentFixture<PrivilegeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PrivilegeComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrivilegeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

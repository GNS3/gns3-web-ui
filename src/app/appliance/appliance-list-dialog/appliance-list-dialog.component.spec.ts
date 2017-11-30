import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ApplianceListDialogComponent } from './appliance-list-dialog.component';

describe('ApplianceListDialogComponent', () => {
  let component: ApplianceListDialogComponent;
  let fixture: ComponentFixture<ApplianceListDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ApplianceListDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ApplianceListDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

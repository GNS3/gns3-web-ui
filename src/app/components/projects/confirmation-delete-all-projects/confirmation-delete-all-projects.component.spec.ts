import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmationDeleteAllProjectsComponent } from './confirmation-delete-all-projects.component';

describe('ConfirmationDeleteAllProjectsComponent', () => {
  let component: ConfirmationDeleteAllProjectsComponent;
  let fixture: ComponentFixture<ConfirmationDeleteAllProjectsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConfirmationDeleteAllProjectsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmationDeleteAllProjectsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

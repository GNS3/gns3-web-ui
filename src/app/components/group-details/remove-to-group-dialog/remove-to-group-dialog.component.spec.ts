import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RemoveToGroupDialogComponent } from './remove-to-group-dialog.component';

describe('RemoveUserToGroupDialogComponent', () => {
  let component: RemoveToGroupDialogComponent;
  let fixture: ComponentFixture<RemoveToGroupDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RemoveToGroupDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RemoveToGroupDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

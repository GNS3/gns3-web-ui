import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditablePermissionComponent } from './editable-permission.component';

describe('EditablePermissionComponent', () => {
  let component: EditablePermissionComponent;
  let fixture: ComponentFixture<EditablePermissionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditablePermissionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditablePermissionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

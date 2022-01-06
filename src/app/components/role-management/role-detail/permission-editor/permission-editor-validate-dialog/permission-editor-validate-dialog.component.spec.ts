import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PermissionEditorValidateDialogComponent } from './permission-editor-validate-dialog.component';

describe('PermissionEditorValidateDialogComponent', () => {
  let component: PermissionEditorValidateDialogComponent;
  let fixture: ComponentFixture<PermissionEditorValidateDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PermissionEditorValidateDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PermissionEditorValidateDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TemplateListDialogComponent } from './template-list-dialog.component';

describe('TemplateListDialogComponent', () => {
  let component: TemplateListDialogComponent;
  let fixture: ComponentFixture<TemplateListDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TemplateListDialogComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TemplateListDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // it('should create', () => {
  //   expect(component).toBeTruthy();
  // });
});

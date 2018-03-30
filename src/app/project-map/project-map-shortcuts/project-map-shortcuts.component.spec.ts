import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectMapShortcutsComponent } from './project-map-shortcuts.component';

describe('ProjectMapShortcutsComponent', () => {
  let component: ProjectMapShortcutsComponent;
  let fixture: ComponentFixture<ProjectMapShortcutsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProjectMapShortcutsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectMapShortcutsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

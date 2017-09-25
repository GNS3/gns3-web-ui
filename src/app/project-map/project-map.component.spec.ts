import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectMapComponent } from './project-map.component';

describe('ProjectMapComponent', () => {
  let component: ProjectMapComponent;
  let fixture: ComponentFixture<ProjectMapComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProjectMapComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});

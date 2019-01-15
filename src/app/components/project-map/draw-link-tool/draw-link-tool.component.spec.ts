import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DrawLinkToolComponent } from './draw-link-tool.component';

describe('DrawLinkToolComponent', () => {
  let component: DrawLinkToolComponent;
  let fixture: ComponentFixture<DrawLinkToolComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [DrawLinkToolComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DrawLinkToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // it('should create', () => {
  //   expect(component).toBeTruthy();
  // });
});

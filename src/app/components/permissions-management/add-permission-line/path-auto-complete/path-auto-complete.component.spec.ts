import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PathAutoCompleteComponent } from './path-auto-complete.component';

describe('PathAutoCompleteComponent', () => {
  let component: PathAutoCompleteComponent;
  let fixture: ComponentFixture<PathAutoCompleteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PathAutoCompleteComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PathAutoCompleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

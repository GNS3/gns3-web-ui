import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LocalServerComponent } from './local-server.component';

describe('LocalServerComponent', () => {
  let component: LocalServerComponent;
  let fixture: ComponentFixture<LocalServerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LocalServerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LocalServerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

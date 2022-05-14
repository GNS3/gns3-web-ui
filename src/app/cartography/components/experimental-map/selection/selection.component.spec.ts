import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SelectionComponent } from './selection.component';

describe('SelectionComponent', () => {
  let component: SelectionComponent;
  let fixture: ComponentFixture<SelectionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SelectionComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(SelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });
  afterEach(() => {
    fixture.destroy()
  })


  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

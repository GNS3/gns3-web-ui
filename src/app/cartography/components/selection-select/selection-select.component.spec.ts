import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SelectionManager } from 'app/cartography/managers/selection-manager';
import { MapChangeDetectorRef } from 'app/cartography/services/map-change-detector-ref';
import { SelectionSelectComponent } from './selection-select.component';

describe('SelectionSelectComponent', () => {
  let component: SelectionSelectComponent;
  let fixture: ComponentFixture<SelectionSelectComponent>;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      declarations: [SelectionSelectComponent],
      providers: [MapChangeDetectorRef,SelectionManager]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectionSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

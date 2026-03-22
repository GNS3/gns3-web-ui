import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MoveLayerUpActionComponent } from './move-layer-up-action.component';

describe('MoveLayerUpActionComponent', () => {
  let component: MoveLayerUpActionComponent;
  let fixture: ComponentFixture<MoveLayerUpActionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      declarations: [MoveLayerUpActionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MoveLayerUpActionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

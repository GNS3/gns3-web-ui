import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatTableModule } from '@angular/material/table';
import { MoveLayerDownActionComponent } from './move-layer-down-action.component';

describe('MoveLayerDownActionComponent', () => {
  let component: MoveLayerDownActionComponent;
  let fixture: ComponentFixture<MoveLayerDownActionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MoveLayerDownActionComponent],
      imports:[MatTableModule]
    }).compileComponents();
  });

  // beforeEach(() => {
  //   fixture = TestBed.createComponent(MoveLayerDownActionComponent);
  //   component = fixture.componentInstance;
  //   fixture.detectChanges();
  // });

  it('should create', () => {
    expect(component)
  });
});

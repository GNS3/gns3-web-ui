import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteResourcePoolComponent } from './delete-resource-pool.component';

describe('DeleteResourcePoolComponent', () => {
  let component: DeleteResourcePoolComponent;
  let fixture: ComponentFixture<DeleteResourcePoolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DeleteResourcePoolComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeleteResourcePoolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

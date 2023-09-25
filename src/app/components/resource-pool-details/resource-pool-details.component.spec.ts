import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResourcePoolDetailsComponent } from './resource-pool-details.component';

describe('ResourcePoolDetailsComponent', () => {
  let component: ResourcePoolDetailsComponent;
  let fixture: ComponentFixture<ResourcePoolDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ResourcePoolDetailsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResourcePoolDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ServerDiscoveryComponent } from './server-discovery.component';
import { MatCardModule } from "@angular/material";

describe('ServerDiscoveryComponent', () => {
  let component: ServerDiscoveryComponent;
  let fixture: ComponentFixture<ServerDiscoveryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [ MatCardModule ],
      declarations: [ ServerDiscoveryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ServerDiscoveryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

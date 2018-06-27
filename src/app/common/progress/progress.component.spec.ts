import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProgressComponent } from './progress.component';
import { MatProgressSpinnerModule } from "@angular/material";
import { ProgressService } from "./progress.service";

describe('ProgressComponent', () => {
  let component: ProgressComponent;
  let fixture: ComponentFixture<ProgressComponent>;
  let progressService: ProgressService;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        MatProgressSpinnerModule,
      ],
      providers: [ ProgressService ],
      declarations: [ ProgressComponent ]
    })
    .compileComponents();

    progressService = TestBed.get(ProgressService);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProgressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and be invisible', () => {
    expect(component).toBeTruthy();
    expect(component.visible).toEqual(false);
  });

  it( 'should change visibility when activated', () => {
    progressService.activate();
    expect(component.visible).toEqual(true);
  });

  it( 'should change visibility when deactivated', () => {
    component.visible = true;

    progressService.deactivate();
    expect(component.visible).toEqual(false);
  });

});

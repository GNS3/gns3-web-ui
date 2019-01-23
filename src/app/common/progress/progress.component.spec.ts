import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProgressComponent } from './progress.component';
import { MatIconModule, MatProgressSpinnerModule } from '@angular/material';
import { ProgressService } from './progress.service';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

class MockedRouter {
  events: BehaviorSubject<boolean>;

  constructor() {
    this.events = new BehaviorSubject(true);
  }
}

describe('ProgressComponent', () => {
  let component: ProgressComponent;
  let fixture: ComponentFixture<ProgressComponent>;
  let progressService: ProgressService;
  let router: MockedRouter;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, MatProgressSpinnerModule, MatIconModule],
      providers: [ProgressService, { provide: Router, useClass: MockedRouter }],
      declarations: [ProgressComponent]
    }).compileComponents();

    progressService = TestBed.get(ProgressService);
    router = TestBed.get(Router);
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

  it('should change visibility when activated', () => {
    progressService.activate();
    expect(component.visible).toEqual(true);
  });

  it('should change visibility when deactivated', () => {
    component.visible = true;

    progressService.deactivate();
    expect(component.visible).toEqual(false);
  });

  it('should set error state when error defined', () => {
    const error = new Error('test');
    progressService.setError(error);
    expect(component.error).toEqual(error);
  });

  it('should clear error when changes route', () => {
    const error = new Error('test');
    component.error = error;

    spyOn(progressService, 'clear');

    router.events.next(true);

    expect(progressService.clear).toHaveBeenCalled();
  });
});

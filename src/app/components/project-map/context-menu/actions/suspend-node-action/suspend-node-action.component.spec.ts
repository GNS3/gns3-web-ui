import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SuspendNodeActionComponent } from './suspend-node-action.component';

describe('SuspendNodeActionComponent', () => {
  let component: SuspendNodeActionComponent;
  let fixture: ComponentFixture<SuspendNodeActionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      
    }).compileComponents();

    fixture = TestBed.createComponent(SuspendNodeActionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RemoveToGroupDialogComponent } from './remove-to-group-dialog.component';

describe('RemoveToGroupDialogComponent', () => {
  let component: RemoveToGroupDialogComponent;
  let fixture: ComponentFixture<RemoveToGroupDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RemoveToGroupDialogComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
    fixture = TestBed.createComponent(RemoveToGroupDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

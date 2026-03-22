import { ComponentFixture, TestBed, provideZonelessChangeDetection } from '@angular/core/testing';
import { RemoveToGroupDialogComponent } from './remove-to-group-dialog.component';

describe('RemoveToGroupDialogComponent', () => {
  let component: RemoveToGroupDialogComponent;
  let fixture: ComponentFixture<RemoveToGroupDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      declarations: [RemoveToGroupDialogComponent],
    });
    fixture = TestBed.createComponent(RemoveToGroupDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
import { ComponentFixture, TestBed, provideZonelessChangeDetection } from '@angular/core/testing';
import { DeleteGroupDialogComponent } from './delete-group-dialog.component';

describe('DeleteGroupDialogComponent', () => {
  let component: DeleteGroupDialogComponent;
  let fixture: ComponentFixture<DeleteGroupDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      declarations: [DeleteGroupDialogComponent],
    });
    fixture = TestBed.createComponent(DeleteGroupDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
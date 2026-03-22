import { ComponentFixture, TestBed, provideZonelessChangeDetection } from '@angular/core/testing';
import { AddGroupDialogComponent } from './add-group-dialog.component';

describe('AddGroupDialogComponent', () => {
  let component: AddGroupDialogComponent;
  let fixture: ComponentFixture<AddGroupDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      declarations: [AddGroupDialogComponent],
    });
    fixture = TestBed.createComponent(AddGroupDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
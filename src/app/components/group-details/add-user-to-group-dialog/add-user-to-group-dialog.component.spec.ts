import { ComponentFixture, TestBed, provideZonelessChangeDetection } from '@angular/core/testing';
import { AddUserToGroupDialogComponent } from './add-user-to-group-dialog.component';

describe('AddUserToGroupDialogComponent', () => {
  let component: AddUserToGroupDialogComponent;
  let fixture: ComponentFixture<AddUserToGroupDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      declarations: [AddUserToGroupDialogComponent],
    });
    fixture = TestBed.createComponent(AddUserToGroupDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
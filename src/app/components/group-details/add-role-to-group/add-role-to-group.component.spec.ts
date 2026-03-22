import { ComponentFixture, TestBed, provideZonelessChangeDetection } from '@angular/core/testing';
import { AddRoleToGroupComponent } from './add-role-to-group.component';

describe('AddRoleToGroupComponent', () => {
  let component: AddRoleToGroupComponent;
  let fixture: ComponentFixture<AddRoleToGroupComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      declarations: [AddRoleToGroupComponent],
    });
    fixture = TestBed.createComponent(AddRoleToGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
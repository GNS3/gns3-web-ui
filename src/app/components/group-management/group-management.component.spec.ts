import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GroupManagementComponent } from './group-management.component';

describe('GroupManagementComponent', () => {
  let component: GroupManagementComponent;
  let fixture: ComponentFixture<GroupManagementComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      declarations: [GroupManagementComponent],
    });
    fixture = TestBed.createComponent(GroupManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

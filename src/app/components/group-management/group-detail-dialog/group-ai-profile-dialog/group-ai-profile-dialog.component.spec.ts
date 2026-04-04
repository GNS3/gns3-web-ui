import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Component, input } from '@angular/core';
import { GroupAiProfileDialogComponent, GroupAiProfileDialogData } from './group-ai-profile-dialog.component';
import { Group } from '@models/groups/group';
import { Controller } from '@models/controller';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock GroupAiProfileTabComponent to avoid complex dependencies
@Component({
  selector: 'app-group-ai-profile-tab',
  standalone: true,
  template: '<div class="mock-ai-profile-tab"></div>',
})
class MockGroupAiProfileTabComponent {
  readonly controller = input<Controller>(undefined);
  readonly group = input<Group>(undefined);
}

describe('GroupAiProfileDialogComponent', () => {
  let component: GroupAiProfileDialogComponent;
  let fixture: ComponentFixture<GroupAiProfileDialogComponent>;
  let mockDialogRef: any;

  const mockGroup: Group = {
    name: 'Test Group',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    user_group_id: 'group-123',
    is_builtin: false,
  };

  const mockController: Controller = {
    id: 1,
    authToken: 'token123',
    name: 'Test Controller',
    location: 'local',
    host: '127.0.0.1',
    port: 3080,
    path: '/',
    ubridge_path: '/usr/local/bin/ubridge',
    status: 'running',
    protocol: 'http:',
    username: 'admin',
    password: 'admin',
    tokenExpired: false,
  };

  const mockDialogData: GroupAiProfileDialogData = {
    group: mockGroup,
    controller: mockController,
  };

  beforeEach(async () => {
    mockDialogRef = {
      close: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [MatDialogModule, MatButtonModule, MatIconModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
      ],
    })
      .overrideComponent(GroupAiProfileDialogComponent, {
        set: {
          imports: [MatDialogModule, MatButtonModule, MatIconModule, MockGroupAiProfileTabComponent],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(GroupAiProfileDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should have dialog data available', () => {
      expect(component.data).toBeDefined();
      expect(component.data.group).toEqual(mockGroup);
      expect(component.data.controller).toEqual(mockController);
    });
  });

  describe('Template rendering', () => {
    it('should display group name in dialog title', () => {
      const titleElement: HTMLElement = fixture.nativeElement.querySelector('h2[mat-dialog-title]');
      expect(titleElement).toBeTruthy();
      expect(titleElement.textContent).toContain(mockGroup.name);
    });

    it('should render GroupAiProfileTabComponent', () => {
      const tabComponent = fixture.nativeElement.querySelector('app-group-ai-profile-tab');
      expect(tabComponent).toBeTruthy();
    });
  });

  describe('close()', () => {
    it('should close the dialog when close() is called', () => {
      component.close();
      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should close dialog when Close button is clicked', () => {
      const closeButton: HTMLButtonElement = fixture.nativeElement.querySelector('button[mat-button]');
      expect(closeButton).toBeTruthy();
      expect(closeButton.textContent).toContain('Close');

      closeButton.click();
      fixture.detectChanges();

      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });
});

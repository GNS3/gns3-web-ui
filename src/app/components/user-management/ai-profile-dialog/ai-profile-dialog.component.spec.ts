import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AiProfileDialogComponent, AiProfileDialogData } from './ai-profile-dialog.component';
import { AiProfilesService } from '@services/ai-profiles.service';
import { User } from '@models/users/user';
import { Controller } from '@models/controller';
import { of } from 'rxjs';
import { LLMModelConfigInheritedResponse } from '@models/ai-profile';

describe('AiProfileDialogComponent', () => {
  let component: AiProfileDialogComponent;
  let fixture: ComponentFixture<AiProfileDialogComponent>;
  let mockDialogRef: { close: ReturnType<typeof vi.fn> };
  let mockAiProfilesService: Partial<AiProfilesService>;
  let mockDialog: { open: ReturnType<typeof vi.fn> };
  let mockSnackBar: { open: ReturnType<typeof vi.fn> };

  const mockUser: User = {
    user_id: 'user-123',
    username: 'testuser',
    email: 'test@example.com',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    full_name: 'Test User',
    last_login: '2024-01-01',
    is_active: true,
    is_superadmin: false,
  };

  const mockController: Controller = {
    authToken: 'test-token',
    id: 1,
    name: 'Test Controller',
    location: 'local',
    host: 'localhost',
    port: 3080,
    path: '/',
    ubridge_path: '',
    protocol: 'http:',
    username: 'admin',
    password: 'admin',
    status: 'running',
    tokenExpired: false,
  };

  const mockDialogData: AiProfileDialogData = {
    user: mockUser,
    controller: mockController,
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    mockDialogRef = { close: vi.fn() };

    mockDialog = {
      open: vi.fn().mockReturnValue({
        afterClosed: () => of(undefined),
      }),
    };

    mockSnackBar = {
      open: vi.fn(),
    };

    mockAiProfilesService = {
      getConfigs: vi.fn().mockReturnValue(
        of<LLMModelConfigInheritedResponse>({
          configs: [],
          default_config: null,
          total: 0,
        })
      ),
      createConfig: vi.fn().mockReturnValue(of({})),
      updateConfig: vi.fn().mockReturnValue(of({})),
      deleteConfig: vi.fn().mockReturnValue(of(undefined)),
      setDefaultConfig: vi.fn().mockReturnValue(of({})),
      unsetDefaultConfig: vi.fn().mockReturnValue(of({})),
    };

    await TestBed.configureTestingModule({
      imports: [AiProfileDialogComponent, MatDialogModule, MatSnackBarModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: MatDialog, useValue: mockDialog },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: AiProfilesService, useValue: mockAiProfilesService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AiProfileDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should inject user data', () => {
    expect(component.data.user).toEqual(mockUser);
  });

  it('should inject controller data', () => {
    expect(component.data.controller).toEqual(mockController);
  });

  describe('close()', () => {
    it('should call dialogRef.close()', () => {
      component.close();
      expect(mockDialogRef.close).toHaveBeenCalledTimes(1);
    });

    it('should call dialogRef.close() only once per call', () => {
      component.close();
      component.close();
      expect(mockDialogRef.close).toHaveBeenCalledTimes(2);
    });
  });

  describe('template rendering', () => {
    it('should display username in title', () => {
      const title: HTMLElement = fixture.nativeElement.querySelector('h2[mat-dialog-title]');
      expect(title.textContent).toContain(mockUser.username);
    });

    it('should contain dialog actions', () => {
      const actions: HTMLElement = fixture.nativeElement.querySelector('mat-dialog-actions');
      expect(actions).toBeTruthy();
    });
  });
});

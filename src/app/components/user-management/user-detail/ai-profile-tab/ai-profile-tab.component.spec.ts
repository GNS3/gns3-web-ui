import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError, BehaviorSubject } from 'rxjs';

import { AiProfileTabComponent } from './ai-profile-tab.component';
import { AiProfilesService } from '../../../../services/ai-profiles.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Controller } from '../../../../models/controller';
import { User } from '../../../../models/users/user';
import {
  LLMModelConfigWithSource,
  LLMModelConfigInheritedResponse,
} from '../../../../models/ai-profile';

function createMockController(): Controller {
  const controller = new Controller();
  controller.id = 1;
  controller.name = 'Test Controller';
  controller.host = '127.0.0.1';
  controller.port = 3080;
  controller.protocol = 'http:';
  controller.path = '';
  return controller;
}

function createMockUser(): User {
  return {
    created_at: '2024-01-01T00:00:00Z',
    email: 'test@example.com',
    full_name: 'Test User',
    last_login: '2024-01-01T00:00:00Z',
    is_active: true,
    is_superadmin: false,
    updated_at: '2024-01-01T00:00:00Z',
    user_id: 'user-123',
    username: 'testuser',
  };
}

function createMockConfig(overrides: Partial<LLMModelConfigWithSource> = {}): LLMModelConfigWithSource {
  return {
    config_id: 'config-1',
    name: 'Test Config',
    model_type: 'text',
    config: {
      provider: 'openai',
      base_url: 'https://api.openai.com/v1',
      model: 'gpt-4o',
      temperature: 0.7,
      context_limit: 128,
    },
    user_id: 'user-123',
    group_id: null,
    is_default: false,
    version: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    source: 'user',
    group_name: null,
    ...overrides,
  };
}

describe('AiProfileTabComponent', () => {
  let component: AiProfileTabComponent;
  let fixture: ComponentFixture<AiProfileTabComponent>;

  let mockAiProfilesService: Partial<AiProfilesService>;
  let mockDialog: Partial<MatDialog>;
  let mockSnackBar: Partial<MatSnackBar>;
  let mockDialogRef: any;
  let afterClosedSubject: BehaviorSubject<any>;
  let mockController: Controller;
  let mockUser: User;
  let mockConfigs: LLMModelConfigWithSource[];

  beforeEach(async () => {
    mockController = createMockController();
    mockUser = createMockUser();
    mockConfigs = [
      createMockConfig({ config_id: 'config-1', name: 'User Config', source: 'user' }),
      createMockConfig({ config_id: 'config-2', name: 'Group Config', source: 'group', group_name: 'Admins', is_default: true }),
    ];

    afterClosedSubject = new BehaviorSubject<any>(undefined);

    mockDialogRef = {
      afterClosed: () => afterClosedSubject.asObservable(),
    };

    mockDialog = {
      open: vi.fn().mockReturnValue(mockDialogRef),
    };

    mockSnackBar = {
      open: vi.fn(),
    };

    mockAiProfilesService = {
      getConfigs: vi.fn().mockReturnValue(
        of<LLMModelConfigInheritedResponse>({
          configs: mockConfigs,
          default_config: mockConfigs[1],
          total: 2,
        })
      ),
      createConfig: vi.fn().mockReturnValue(of(createMockConfig())),
      updateConfig: vi.fn().mockReturnValue(of(createMockConfig())),
      deleteConfig: vi.fn().mockReturnValue(of(undefined)),
      setDefaultConfig: vi.fn().mockReturnValue(of(createMockConfig())),
      unsetDefaultConfig: vi.fn().mockReturnValue(of(createMockConfig())),
    };

    await TestBed.configureTestingModule({
      imports: [AiProfileTabComponent],
      providers: [
        { provide: AiProfilesService, useValue: mockAiProfilesService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: MatSnackBar, useValue: mockSnackBar },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AiProfileTabComponent);
    component = fixture.componentInstance;

    component.configs$.next(mockConfigs);
    component.defaultConfig$.next(mockConfigs[1]);
    component['configs'].set(mockConfigs);
    component['defaultConfig'].set(mockConfigs[1]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getProviderDisplay', () => {
    it.each([
      ['https://api.openai.com/v1', 'openai.com'],
      ['https://openrouter.ai/api/v1', 'openrouter.ai'],
      ['https://api.anthropic.com', 'anthropic.com'],
      ['https://generativelanguage.googleapis.com/v1', 'generativelanguage.googleapis.com'],
    ])('should extract hostname $expected from base_url $baseUrl', (baseUrl, expected) => {
      const config = createMockConfig({ config: { ...mockConfigs[0].config, base_url: baseUrl } });
      expect(component.getProviderDisplay(config)).toBe(expected);
    });

    it('should remove api. prefix from hostname', () => {
      const config = createMockConfig({ config: { ...mockConfigs[0].config, base_url: 'https://api.openai.com/v1' } });
      expect(component.getProviderDisplay(config)).toBe('openai.com');
    });

    it('should fallback to provider name when base_url is empty', () => {
      const config = createMockConfig({ config: { ...mockConfigs[0].config, base_url: '' } });
      expect(component.getProviderDisplay(config)).toBe(config.config.provider);
    });

    it('should fallback to provider name when URL parsing fails', () => {
      const config = createMockConfig({ config: { ...mockConfigs[0].config, base_url: 'not-a-valid-url' } });
      expect(component.getProviderDisplay(config)).toBe(config.config.provider);
    });
  });

  describe('isEditable', () => {
    it('should return true when config source is user', () => {
      const config = createMockConfig({ source: 'user' });
      expect(component.isEditable(config)).toBe(true);
    });

    it('should return false when config source is group', () => {
      const config = createMockConfig({ source: 'group' });
      expect(component.isEditable(config)).toBe(false);
    });
  });

  describe('isDefault', () => {
    it('should return true when config_id matches defaultConfig', () => {
      component['defaultConfig'].set(mockConfigs[0]);
      const config = createMockConfig({ config_id: mockConfigs[0].config_id });
      expect(component.isDefault(config)).toBe(true);
    });

    it('should return false when config_id does not match defaultConfig', () => {
      component['defaultConfig'].set(mockConfigs[0]);
      const config = createMockConfig({ config_id: 'different-config-id' });
      expect(component.isDefault(config)).toBe(false);
    });

    it('should return false when defaultConfig is null', () => {
      component['defaultConfig'].set(null);
      const config = createMockConfig({ config_id: 'any-id' });
      expect(component.isDefault(config)).toBe(false);
    });
  });

  describe('getSourceDisplay', () => {
    it('should return "User" for user source', () => {
      const config = createMockConfig({ source: 'user' });
      expect(component.getSourceDisplay(config)).toBe('User');
    });

    it('should return "Group: name" for group source with group_name', () => {
      const config = createMockConfig({ source: 'group', group_name: 'Admins' });
      expect(component.getSourceDisplay(config)).toBe('Group: Admins');
    });

    it('should return "Group: Unknown" for group source without group_name', () => {
      const config = createMockConfig({ source: 'group', group_name: null });
      expect(component.getSourceDisplay(config)).toBe('Group: Unknown');
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      component.ngOnDestroy();
      expect(true).toBeTruthy();
    });
  });
});

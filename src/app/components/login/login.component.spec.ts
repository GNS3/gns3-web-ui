import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { ReactiveFormsModule, FormControl, FormGroup } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LoginService } from '@services/login.service';
import { ControllerDatabase } from '@services/controller.database';
import { ControllerService } from '@services/controller.service';
import { ThemeService } from '@services/theme.service';
import { ToasterService } from '@services/toaster.service';
import { VersionService } from '@services/version.service';
import { ConnectionManagerService } from '@services/connection-manager.service';
import { Controller } from '@models/controller';
import { of, throwError } from 'rxjs';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let mockLoginService: LoginService;
  let mockControllerService: ControllerService;
  let mockControllerDatabase: ControllerDatabase;
  let mockToasterService: ToasterService;
  let mockVersionService: VersionService;
  let mockThemeService: ThemeService;
  let mockConnectionManagerService: ConnectionManagerService;
  let mockRouter: Router;
  let mockActivatedRoute: ActivatedRoute;

  const mockController: Controller = {
    id: 1,
    name: 'Test Controller',
    host: 'localhost',
    port: 3080,
    protocol: 'http:',
    authToken: '',
    tokenExpired: false,
  } as Controller;

  beforeEach(async () => {
    vi.clearAllMocks();

    mockLoginService = {
      login: vi.fn(),
    } as any as LoginService;

    mockControllerService = {
      get: vi.fn().mockResolvedValue(mockController),
      update: vi.fn().mockResolvedValue(mockController),
    } as any as ControllerService;

    mockControllerDatabase = {
      getController: vi.fn().mockReturnValue(mockController),
    } as any as ControllerDatabase;

    mockToasterService = {
      error: vi.fn(),
      success: vi.fn(),
    } as any as ToasterService;

    mockVersionService = {
      get: vi.fn().mockReturnValue(of({ version: '3.0.0' })),
    } as any as VersionService;

    mockThemeService = {
      getActualTheme: vi.fn().mockReturnValue('light'),
    } as any as ThemeService;

    mockConnectionManagerService = {
      establishConnection: vi.fn(),
      connect: vi.fn(),
      disconnect: vi.fn(),
    } as any as ConnectionManagerService;

    mockRouter = {
      navigate: vi.fn(),
      navigateByUrl: vi.fn(),
    } as any as Router;

    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: vi.fn().mockReturnValue('1'),
        },
        queryParams: { returnUrl: '/' },
      },
    } as any as ActivatedRoute;

    // Mock localStorage
    const storage: Record<string, string> = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => storage[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        storage[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete storage[key];
      }),
    });

    // Mock setTimeout
    vi.stubGlobal(
      'setTimeout',
      vi.fn((cb: Function) => cb())
    );

    await TestBed.configureTestingModule({
      imports: [
        LoginComponent,
        ReactiveFormsModule,
        RouterModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatCheckboxModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
      ],
      providers: [
        { provide: LoginService, useValue: mockLoginService },
        { provide: ControllerService, useValue: mockControllerService },
        { provide: ControllerDatabase, useValue: mockControllerDatabase },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: VersionService, useValue: mockVersionService },
        { provide: ThemeService, useValue: mockThemeService },
        { provide: ConnectionManagerService, useValue: mockConnectionManagerService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with correct default values', () => {
    expect(component.isLoading()).toBe(false);
    expect(component.hidePassword()).toBe(true);
    expect(component.isCapsLockOn()).toBe(false);
    expect(component.isRememberMeChecked()).toBe(false);
    expect(component.returnUrl()).toBe('/');
  });

  it('should have isLightThemeEnabled computed signal', () => {
    expect(component.isLightThemeEnabled()).toBe(true);
  });

  it('should have loginForm with username and password controls', () => {
    expect(component.loginForm).toBeDefined();
    expect(component.loginForm.get('username')).toBeDefined();
    expect(component.loginForm.get('password')).toBeDefined();
  });

  it('should toggle password visibility', () => {
    expect(component.hidePassword()).toBe(true);
    component.togglePasswordVisibility();
    expect(component.hidePassword()).toBe(false);
    component.togglePasswordVisibility();
    expect(component.hidePassword()).toBe(true);
  });

  it('should update caps lock state', () => {
    const mockEvent = {
      getModifierState: vi.fn().mockReturnValue(true),
    } as any as KeyboardEvent;

    component.onCapsLock(mockEvent);
    expect(component.isCapsLockOn()).toBe(true);
  });

  it('should update remember me checked state', () => {
    component.onRememberMeChange(true);
    expect(component.isRememberMeChecked()).toBe(true);
    component.onRememberMeChange(false);
    expect(component.isRememberMeChecked()).toBe(false);
  });

  it('should show error when login form is invalid', () => {
    component.loginForm.get('username')?.setValue('');
    component.loginForm.get('password')?.setValue('');

    component.login();

    expect(mockToasterService.error).toHaveBeenCalledWith('Please enter username and password');
  });

  it('should call loginService.login when form is valid', () => {
    component.loginForm.get('username')?.setValue('admin');
    component.loginForm.get('password')?.setValue('admin');

    mockLoginService.login = vi.fn().mockReturnValue(of({ access_token: 'test-token', token_type: 'Bearer' }));

    component.login();

    expect(mockLoginService.login).toHaveBeenCalled();
  });

  it('should handle login error with standardized message', async () => {
    component.loginForm.get('username')?.setValue('admin');
    component.loginForm.get('password')?.setValue('wrong');

    mockLoginService.login = vi.fn().mockReturnValue(throwError(() => ({ error: { message: 'Invalid credentials' } })));

    component.login();

    await vi.runAllTimersAsync();

    // The error handler should set isLoading to false and display standardized message
    expect(component.isLoading()).toBe(false);
    expect(mockToasterService.error).toHaveBeenCalledWith('Invalid credentials');
  });

  it('should have currentYear as number', () => {
    expect(typeof component.currentYear).toBe('number');
    expect(component.currentYear).toBeGreaterThanOrEqual(2024);
  });

  it('should have controllerName getter', () => {
    expect(component.controllerName).toBe('Test Controller');
  });

  it('should have controllerAddress getter', () => {
    expect(component.controllerAddress).toBe('localhost:3080');
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });
});

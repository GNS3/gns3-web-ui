import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  computed,
  inject,
  signal,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthResponse } from '@models/authResponse';
import { Controller, ControllerProtocol } from '@models/controller';
import { Version } from '@models/version';
import { LoginService } from '@services/login.service';
import { ControllerService } from '@services/controller.service';
import { ThemeService } from '@services/theme.service';
import { ToasterService } from '@services/toaster.service';
import { VersionService } from '@services/version.service';
import { ConnectionManagerService } from '@services/connection-manager.service';

interface RememberMeData {
  username: string;
  isRememberMe: boolean;
}

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent implements OnInit {
  private loginService = inject(LoginService);
  private controllerService = inject(ControllerService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toasterService = inject(ToasterService);
  private versionService = inject(VersionService);
  private themeService = inject(ThemeService);
  private connectionManager = inject(ConnectionManagerService);
  private cd = inject(ChangeDetectorRef);

  private controller: Controller;
  readonly returnUrl = signal('');

  @ViewChild('usernameInput') usernameInput!: ElementRef<HTMLInputElement>;

  // Signals for state management
  public version = signal('');
  public isLoading = signal(false);
  public hidePassword = signal(true);
  public isCapsLockOn = signal(false);
  public isRememberMeChecked = signal(false);
  public readonly currentYear = new Date().getFullYear();

  // Computed signals
  public readonly isLightThemeEnabled = computed(() => this.themeService.getActualTheme() === 'light');

  // Typed FormGroup with proper control types
  loginForm: FormGroup<{
    username: FormControl<string>;
    password: FormControl<string>;
  }> = new FormGroup<{
    username: FormControl<string>;
    password: FormControl<string>;
  }>({
    username: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    password: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
  });

  ngOnInit() {
    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    const id = parseInt(controller_id, 10);
    this.returnUrl.set(this.route.snapshot.queryParams['returnUrl'] || '/');

    this.controllerService.get(id).then(
      async (controller: Controller) => {
        if (!controller) {
          controller = this.createFallbackController(id);
          try {
            await this.controllerService.create(controller);
          } catch {
            await this.controllerService.update(controller);
          }
        }

        this.controller = controller;

        if (controller.authToken && !controller.tokenExpired) {
          this.router.navigate(['/controller', this.controller.id, 'systemstatus']);
        }

        this.versionService.get(this.controller).subscribe({
          next: (version: Version) => {
            this.version.set(version.version);
          },
          error: (err) => {
            const message = err.error?.message || err.message || 'Failed to load version';
            this.toasterService.error(message);
            this.cd.markForCheck();
          },
        });
      },
      () => {
        this.controller = this.createFallbackController(id);
        this.cd.markForCheck();
      }
    );

    // Load remember me data
    this.loadRememberMeData();

    // Auto-focus username input after a short delay
    setTimeout(() => {
      if (this.usernameInput) {
        this.usernameInput.nativeElement.focus();
      }
    }, 100);
  }

  private createFallbackController(id?: number): Controller {
    const port = parseInt(window.location.port, 10) || (window.location.protocol === 'https:' ? 443 : 80);
    const controller = new Controller();
    controller.id = id && !isNaN(id) && id > 0 ? id : 1;
    controller.name = 'local';
    controller.host = window.location.hostname || 'localhost';
    controller.port = port;
    controller.location = 'bundled';
    controller.protocol = (window.location.protocol as ControllerProtocol) || 'http:';
    return controller;
  }

  private loadRememberMeData() {
    const storedData = localStorage.getItem('isRememberMe');
    if (storedData) {
      try {
        const data: RememberMeData = JSON.parse(storedData);
        if (data.isRememberMe) {
          this.loginForm.controls.username.setValue(data.username);
          this.isRememberMeChecked.set(true);
        }
      } catch (e) {
        console.error('Failed to parse remember me data', e);
      }
    }
  }

  public togglePasswordVisibility(): void {
    this.hidePassword.update((value) => !value);
  }

  public onCapsLock(event: KeyboardEvent): void {
    this.isCapsLockOn.set(event.getModifierState && event.getModifierState('CapsLock'));
  }

  public login() {
    if (this.loginForm.invalid) {
      this.toasterService.error('Please enter username and password');
      return;
    }

    if (!this.controller) {
      this.controller = this.createFallbackController();
    }

    const username = this.loginForm.value.username;
    const password = this.loginForm.value.password;

    this.isLoading.set(true);

    this.loginService.login(this.controller, username, password).subscribe({
      next: async (response: AuthResponse) => {
        try {
          const controller = this.controller;
          if (!controller) {
            throw new Error('Controller configuration is missing');
          }

          controller.authToken = response.access_token;

          // Save refresh_token for silent token refresh
          if (response.refresh_token) {
            try {
              localStorage.setItem(`refresh_token_${controller.id}`, response.refresh_token);
            } catch (storageErr) {
              console.warn('Failed to store refresh token in localStorage:', storageErr);
            }
          }

          controller.username = response.username || username;
          controller.password = password;
          controller.tokenExpired = false;
          await this.controllerService.update(controller);

          // Establish global WebSocket connection defensively
          try {
            this.connectionManager.establishConnection(controller);
          } catch (wsErr) {
            console.warn('Deferred WebSocket connection after login:', wsErr);
          }

          // Handle remember me
          try {
            this.handleRememberMe(username);
          } catch (rmErr) {
            console.warn('Failed to save remember-me state:', rmErr);
          }

          this.isLoading.set(false);
          this.cd.markForCheck();

          if (this.returnUrl().length <= 1) {
            await this.router.navigate(['/controller', controller.id, 'systemstatus']);
          } else {
            await this.router.navigateByUrl(this.returnUrl());
          }
        } catch (err: any) {
          console.error('Login post-processing failed:', err);
          this.isLoading.set(false);
          const message = err?.error?.message || err?.message || 'Authentication error';
          this.toasterService.error(message);
          this.cd.markForCheck();
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        const message = err.error?.message || err.message || 'Authentication failed';
        this.toasterService.error(message);
        this.cd.markForCheck();
      },
    });
  }

  private handleRememberMe(username: string): void {
    if (this.isRememberMeChecked()) {
      const data: RememberMeData = {
        username: username,
        isRememberMe: true,
      };
      localStorage.setItem('isRememberMe', JSON.stringify(data));
    } else {
      localStorage.removeItem('isRememberMe');
    }
  }

  public onRememberMeChange(checked: boolean): void {
    this.isRememberMeChecked.set(checked);
  }

  public get controllerName(): string {
    return this.controller?.name || '';
  }

  public get controllerAddress(): string {
    if (this.controller) {
      return `${this.controller.host}:${this.controller.port}`;
    }
    return '';
  }
}

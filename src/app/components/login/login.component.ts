import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthResponse } from '@models/authResponse';
import { Controller } from '@models/controller';
import { Version } from '@models/version';
import { LoginService } from '@services/login.service';
import { ControllerDatabase } from '@services/controller.database';
import { ControllerService } from '@services/controller.service';
import { ThemeService } from '@services/theme.service';
import { ToasterService } from '@services/toaster.service';
import { VersionService } from '@services/version.service';

interface RememberMeData {
  username: string;
  isRememberMe: boolean;
}

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  imports: [
    CommonModule,
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent implements OnInit {
  private loginService = inject(LoginService);
  private controllerService = inject(ControllerService);
  private controllerDatabase = inject(ControllerDatabase);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toasterService = inject(ToasterService);
  private versionService = inject(VersionService);
  private themeService = inject(ThemeService);

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

  constructor() {}

  ngOnInit() {
    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    this.returnUrl.set(this.route.snapshot.queryParams['returnUrl'] || '/');

    this.controllerService.get(parseInt(controller_id, 10)).then((controller: Controller) => {
      this.controller = controller;

      if (controller.authToken) {
        this.router.navigate(['/controller', this.controller.id, 'projects']);
      }

      this.versionService.get(this.controller).subscribe((version: Version) => {
        this.version.set(version.version);
      });
    });

    // Load remember me data
    this.loadRememberMeData();

    // Auto-focus username input after a short delay
    setTimeout(() => {
      if (this.usernameInput) {
        this.usernameInput.nativeElement.focus();
      }
    }, 100);
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

    const username = this.loginForm.value.username;
    const password = this.loginForm.value.password;

    this.isLoading.set(true);

    this.loginService.login(this.controller, username, password).subscribe(
      async (response: AuthResponse) => {
        let controller = this.controller;
        controller.authToken = response.access_token;
        controller.username = username;
        controller.password = password;
        controller.tokenExpired = false;
        await this.controllerService.update(controller);

        // Handle remember me
        this.handleRememberMe(username);

        this.isLoading.set(false);

        if (this.returnUrl().length <= 1) {
          this.router.navigate(['/controller', this.controller.id, 'projects']);
        } else {
          this.router.navigateByUrl(this.returnUrl());
        }
      },
      (error) => {
        this.isLoading.set(false);
        this.toasterService.error('Authentication was unsuccessful. The default username and password is admin');
      }
    );
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

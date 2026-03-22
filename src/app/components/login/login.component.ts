import { ChangeDetectionStrategy, Component, DoCheck, OnInit, ViewEncapsulation, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatError } from '@angular/material/form-field';
import { AuthResponse } from '@models/authResponse';
import { Controller } from '@models/controller';
import { Version } from '@models/version';
import { LoginService } from '@services/login.service';
import { ControllerDatabase } from '@services/controller.database';
import { ControllerService } from '@services/controller.service';
import { ThemeService } from '@services/theme.service';
import { ToasterService } from '@services/toaster.service';
import { VersionService } from '@services/version.service';

@Component({
  standalone: true,
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  encapsulation: ViewEncapsulation.None,
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
    MatError
  ],
  // TODO: This component has been partially migrated to be zoneless-compatible.
  // After testing, this should be updated to ChangeDetectionStrategy.OnPush.
  changeDetection: ChangeDetectionStrategy.Default,
})
export class LoginComponent implements OnInit, DoCheck {
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
  public version = signal('');
  public isLightThemeEnabled = signal(false);
  public loginError = signal(false);
  public isRememberMe = signal(false);
  public isRememberMeChecked = signal(false);

  loginForm = new UntypedFormGroup({
    username: new UntypedFormControl('', [Validators.required]),
    password: new UntypedFormControl('', [Validators.required]),
  });

  constructor() {}

  async ngOnInit() {
    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    this.returnUrl.set(this.route.snapshot.queryParams['returnUrl'] || '/');
    this.controllerService.get(parseInt(controller_id, 10)).then((controller: Controller ) => {
      this.controller = controller;

      if (controller.authToken) {
        this.router.navigate(['/controller', this.controller.id, 'projects']);
      }

      this.versionService.get(this.controller).subscribe((version: Version) => {
        this.version.set(version.version);
      });
    });

    this.themeService.getActualTheme() === 'light'
      ? this.isLightThemeEnabled.set(true)
      : this.isLightThemeEnabled.set(false);

    let getCurrentUser = JSON.parse(localStorage.getItem(`isRememberMe`)) ?? null;
    if (getCurrentUser && getCurrentUser.isRememberMe) {
      this.loginForm.get('username').setValue(getCurrentUser.username);
      this.loginForm.get('password').setValue(getCurrentUser.password);
      this.isRememberMeChecked.set(getCurrentUser.isRememberMe);
    }
  }

  public login() {
    if (this.loginForm.get('username').invalid || this.loginForm.get('password').invalid) {
      this.toasterService.error('Please enter username and password');
      return;
    }

    let username = this.loginForm.get('username').value;
    let password = this.loginForm.get('password').value;

    this.loginService.login(this.controller, username, password).subscribe(
      async (response: AuthResponse) => {
        let controller = this.controller;
        controller.authToken = response.access_token;
        controller.username = username;
        controller.password = password;
        controller.tokenExpired = false;
        await this.controllerService.update(controller);

        if (this.returnUrl().length <= 1) {
          this.router.navigate(['/controller', this.controller.id, 'projects']);
        } else {
          this.router.navigateByUrl(this.returnUrl());
        }
      },
      (error) => {
        this.isRememberMe.set(false);
        this.loginError.set(true);
      }
    );
  }

  rememberMe(ev) {
    if (ev.checked) {
      let current_user = {
        username: this.loginForm.get('username').value,
        password: this.loginForm.get('password').value,
        isRememberMe: ev.checked,
      };
      this.isRememberMeChecked.set(ev.checked);
      localStorage.setItem(`isRememberMe`, JSON.stringify(current_user));
    } else {
      localStorage.removeItem(`isRememberMe`);
      this.loginForm.reset();
      this.isRememberMe.set(ev.checked);
    }
  }

  ngDoCheck() {
    if (this.loginForm.get('username').valid && this.loginForm.get('password').valid) {
      this.isRememberMe.set(true);
    }
  }
}

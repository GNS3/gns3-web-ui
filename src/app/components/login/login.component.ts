import { Component, DoCheck, OnInit, ViewEncapsulation, inject } from '@angular/core';
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
  ]
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
  public version: string;
  public isLightThemeEnabled: boolean = false;
  public loginError: boolean = false;
  public returnUrl: string = '';
  public isRememberMe: boolean = false;
  public isRememberMeChecked: boolean = false;

  loginForm = new UntypedFormGroup({
    username: new UntypedFormControl('', [Validators.required]),
    password: new UntypedFormControl('', [Validators.required]),
  });

  constructor() {}

  async ngOnInit() {
    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    this.controllerService.get(parseInt(controller_id, 10)).then((controller: Controller ) => {
      this.controller = controller;

      if (controller.authToken) {
        this.router.navigate(['/controller', this.controller.id, 'projects']);
      }

      this.versionService.get(this.controller).subscribe((version: Version) => {
        this.version = version.version;
      });
    });

    this.themeService.getActualTheme() === 'light'
      ? (this.isLightThemeEnabled = true)
      : (this.isLightThemeEnabled = false);

    let getCurrentUser = JSON.parse(localStorage.getItem(`isRememberMe`)) ?? null;
    if (getCurrentUser && getCurrentUser.isRememberMe) {
      this.loginForm.get('username').setValue(getCurrentUser.username);
      this.loginForm.get('password').setValue(getCurrentUser.password);
      this.isRememberMeChecked = getCurrentUser.isRememberMe;
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

        if (this.returnUrl.length <= 1) {
          this.router.navigate(['/controller', this.controller.id, 'projects']);
        } else {
          this.router.navigateByUrl(this.returnUrl);
        }
      },
      (error) => {
        this.isRememberMe = false;
        this.loginError = true;
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
      this.isRememberMeChecked = ev.checked;
      localStorage.setItem(`isRememberMe`, JSON.stringify(current_user));
    } else {
      localStorage.removeItem(`isRememberMe`);
      this.loginForm.reset();
      this.isRememberMe = ev.checked;
    }
  }

  ngDoCheck() {
    if (this.loginForm.get('username').valid && this.loginForm.get('password').valid) {
      this.isRememberMe = true;
    }
  }
}

import { Component, DoCheck, OnInit, ViewEncapsulation } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthResponse } from '../../models/authResponse';
import{ Controller } from '../../models/controller';
import { Version } from '../../models/version';
import { LoginService } from '../../services/login.service';
import { ControllerDatabase } from '../../services/controller.database';
import { ControllerService } from '../../services/controller.service';
import { ThemeService } from '../../services/theme.service';
import { ToasterService } from '../../services/toaster.service';
import { VersionService } from '../../services/version.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class LoginComponent implements OnInit, DoCheck {
  private controller:Controller ;
  public version: string;
  public isLightThemeEnabled: boolean = false;
  public loginError: boolean = false;
  public returnUrl: string = '';
  public isRememberMe: boolean = false;
  public isRememberMeCheked: boolean = false;

  loginForm = new UntypedFormGroup({
    username: new UntypedFormControl('', [Validators.required]),
    password: new UntypedFormControl('', [Validators.required]),
  });

  constructor(
    private loginService: LoginService,
    private controllerService: ControllerService,
    private controllerDatabase: ControllerDatabase,
    private route: ActivatedRoute,
    private router: Router,
    private toasterService: ToasterService,
    private versionService: VersionService,
    private themeService: ThemeService
  ) {}

  async ngOnInit() {
    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    this.controllerService.get(parseInt(controller_id, 10)).then((controller:Controller ) => {
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
      this.isRememberMeCheked = getCurrentUser.isRememberMe;
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
        this.loginError = true;
      }
    );
  }

  rememberMe(ev) {
    if (ev.checked) {
      let curren_user = {
        username: this.loginForm.get('username').value,
        password: this.loginForm.get('password').value,
        isRememberMe: ev.checked,
      };
      this.isRememberMeCheked = ev.checked;
      localStorage.setItem(`isRememberMe`, JSON.stringify(curren_user));
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

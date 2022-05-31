import { Component, DoCheck, OnInit, ViewEncapsulation } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthResponse } from '../../models/authResponse';
import { Server } from '../../models/server';
import { Version } from '../../models/version';
import { LoginService } from '../../services/login.service';
import { ServerDatabase } from '../../services/server.database';
import { ServerService } from '../../services/server.service';
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
  private server: Server;
  public version: string;
  public isLightThemeEnabled: boolean = false;
  public loginError: boolean = false;
  public returnUrl: string = '';
  public isRememberMe: boolean = false;
  public isRememberMeCheked: boolean = false;

  loginForm = new FormGroup({
    username: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required]),
  });

  constructor(
    private loginService: LoginService,
    private serverService: ServerService,
    private serverDatabase: ServerDatabase,
    private route: ActivatedRoute,
    private router: Router,
    private toasterService: ToasterService,
    private versionService: VersionService,
    private themeService: ThemeService
  ) {}

  async ngOnInit() {
    const server_id = this.route.snapshot.paramMap.get('server_id');
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    this.serverService.get(parseInt(server_id, 10)).then((server: Server) => {
      this.server = server;

      if (server.authToken) {
        this.router.navigate(['/server', this.server.id, 'projects']);
      }

      this.versionService.get(this.server).subscribe((version: Version) => {
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

    this.loginService.login(this.server, username, password).subscribe(
      async (response: AuthResponse) => {
        let server = this.server;
        server.authToken = response.access_token;
        server.username = username;
        server.password = password;
        server.tokenExpired = false;
        await this.serverService.update(server);

        if (this.returnUrl.length <= 1) {
          this.router.navigate(['/server', this.server.id, 'projects']);
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
    if (this.loginForm.get('username').valid || this.loginForm.get('password').valid) {
      this.isRememberMe = true;
    }
  }
}

import { Component, ComponentFactoryResolver, OnInit, ViewEncapsulation } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Server } from '../../models/server';
import { LoginService } from '../../services/login.service';
import { ServerDatabase } from '../../services/server.database';
import { ServerService } from '../../services/server.service';
import { ToasterService } from '../../services/toaster.service';
import { AuthResponse } from '../../models/authResponse';
import { VersionService } from '../../services/version.service';
import { Version } from '../../models/version';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class LoginComponent implements OnInit {
    private server: Server;
    public version: string;

    loginForm = new FormGroup({
        username: new FormControl('', [Validators.required]),
        password: new FormControl('', [Validators.required])
    });

    constructor(
        private loginService: LoginService,
        private serverService: ServerService,
        private serverDatabase: ServerDatabase,
        private route: ActivatedRoute,
        private router: Router,
        private toasterService: ToasterService,
        private versionService: VersionService
    ) {}

    async ngOnInit() {
        const server_id = this.route.snapshot.paramMap.get('server_id');
        this.serverService.get(parseInt(server_id, 10)).then((server: Server) => {
            this.server = server;

            this.versionService.get(this.server).subscribe((version: Version) => {
                this.version = version.version;
            });
        });
    }

    public login() {
        if (this.loginForm.get('username').invalid || this.loginForm.get('password').invalid) {
            this.toasterService.error("Please enter username and password")
            return;
        }

        let username = this.loginForm.get('username').value;
        let password = this.loginForm.get('password').value;

        this.loginService.login(this.server, username, password).subscribe(async (response: AuthResponse) => {
            let server = this.server;
            server.authToken = response.access_token;
            await this.serverService.update(server);

            this.router.navigate(['/server', this.server.id, 'projects']);
        });
    }
}

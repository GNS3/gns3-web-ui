import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ServerService } from '../../../services/server.service';
import { UserService } from '../../../services/user.service';
import { ToasterService } from '../../../services/toaster.service';
import { User } from '../../../models/users/user';
import { Server } from '../../../models/server';

@Component({
  selector: 'app-logged-user',
  templateUrl: './logged-user.component.html',
  styleUrls: ['./logged-user.component.scss'],
})
export class LoggedUserComponent implements OnInit {
    public user: User;
    public server: Server;

    constructor(
        private route: ActivatedRoute,
        private serverService: ServerService,
        private userService: UserService,
        private toasterService: ToasterService
    ) {}

    ngOnInit() {
        let serverId = this.route.snapshot.paramMap.get('controller_id');
        this.serverService.get(+serverId).then((server: Server) => {
            this.server = server;
            this.userService.getInformationAboutLoggedUser(server).subscribe((response: any) => {
                this.user = response;
            });
        });
    }

    copyToken() {
        const selBox = document.createElement('textarea');
        selBox.style.position = 'fixed';
        selBox.style.left = '0';
        selBox.style.top = '0';
        selBox.style.opacity = '0';
        selBox.value = this.server.authToken;
        document.body.appendChild(selBox);
        selBox.focus();
        selBox.select();
        document.execCommand('copy');
        document.body.removeChild(selBox);

        this.toasterService.success('Token copied');
    }
}

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ControllerService } from '../../../services/controller.service';
import { UserService } from '../../../services/user.service';
import { ToasterService } from '../../../services/toaster.service';
import { User } from '../../../models/users/user';
import { Controller } from '../../../models/controller';
import { ChangeUserPasswordComponent } from "@components/user-management/user-detail/change-user-password/change-user-password.component";
import { MatDialog } from "@angular/material/dialog";

@Component({
  selector: 'app-logged-user',
  templateUrl: './logged-user.component.html',
  styleUrls: ['./logged-user.component.scss'],
})
export class LoggedUserComponent implements OnInit {
    public user: User;
    public controller:Controller ;

    constructor(
        private route: ActivatedRoute,
        private controllerService: ControllerService,
        private userService: UserService,
        private toasterService: ToasterService,
        public dialog: MatDialog
    ) {}

    ngOnInit() {
        let controllerId = this.route.snapshot.paramMap.get('controller_id');
        this.controllerService.get(+controllerId).then((controller:Controller ) => {
            this.controller = controller;
            this.userService.getInformationAboutLoggedUser(controller).subscribe((response: any) => {
                this.user = response;
            });
        });
    }

    changePassword() {
        this.dialog.open<ChangeUserPasswordComponent>(ChangeUserPasswordComponent,
          {width: '400px', height: '300px', data: {user: this.user, controller: this.controller, self_update: true}});
    }

    copyToken() {
        const selBox = document.createElement('textarea');
        selBox.style.position = 'fixed';
        selBox.style.left = '0';
        selBox.style.top = '0';
        selBox.style.opacity = '0';
        selBox.value = this.controller.authToken;
        document.body.appendChild(selBox);
        selBox.focus();
        selBox.select();
        document.execCommand('copy');
        document.body.removeChild(selBox);

        this.toasterService.success('Token copied');
    }
}

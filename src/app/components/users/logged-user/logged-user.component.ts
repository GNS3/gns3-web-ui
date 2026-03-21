import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { ControllerService } from '@services/controller.service';
import { UserService } from '@services/user.service';
import { ToasterService } from '@services/toaster.service';
import { User } from '@models/users/user';
import { Controller } from '@models/controller';
import { ChangeUserPasswordComponent } from "@components/user-management/user-detail/change-user-password/change-user-password.component";

@Component({
  standalone: true,
  selector: 'app-logged-user',
  templateUrl: './logged-user.component.html',
  styleUrls: ['./logged-user.component.scss'],
  imports: [CommonModule, RouterModule, MatCardModule, MatListModule, MatButtonModule, MatDialogModule]
})
export class LoggedUserComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private controllerService = inject(ControllerService);
    private userService = inject(UserService);
    private toasterService = inject(ToasterService);
    public dialog = inject(MatDialog);

    public user: User;
    public controller: Controller;

    constructor() {}

    ngOnInit() {
        let controllerId = this.route.snapshot.paramMap.get('controller_id');
        this.controllerService.get(+controllerId).then((controller: Controller ) => {
            this.controller = controller;
            this.userService.getInformationAboutLoggedUser(controller).subscribe((response: any) => {
                this.user = response;
            });
        });
    }

    changePassword() {
        this.dialog.open<ChangeUserPasswordComponent>(ChangeUserPasswordComponent,
          {width: '500px', height: '300px', data: {user: this.user, controller: this.controller, self_update: true}});
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

import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ControllerService } from '@services/controller.service';
import { UserService } from '@services/user.service';
import { ToasterService } from '@services/toaster.service';
import { User } from '@models/users/user';
import { Controller } from '@models/controller';
import { ChangeUserPasswordComponent } from '@components/user-management/user-detail/change-user-password/change-user-password.component';

@Component({
  selector: 'app-logged-user',
  templateUrl: './logged-user.component.html',
  styleUrl: './logged-user.component.scss',
  imports: [CommonModule, RouterModule, MatButtonModule, MatDialogModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoggedUserComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private controllerService = inject(ControllerService);
  private userService = inject(UserService);
  private toasterService = inject(ToasterService);
  public dialog = inject(MatDialog);

  public user = signal<User | undefined>(undefined);
  public controller: Controller;

  constructor() {}

  ngOnInit() {
    let controllerId = this.route.snapshot.paramMap.get('controller_id');
    this.controllerService.get(+controllerId).then((controller: Controller) => {
      this.controller = controller;
      this.userService.getInformationAboutLoggedUser(controller).subscribe((response: any) => {
        this.user.set(response);
      });
    });
  }

  changePassword() {
    this.dialog.open<ChangeUserPasswordComponent>(ChangeUserPasswordComponent, {
      panelClass: ['base-dialog-panel', 'change-user-password-dialog-panel'],
      data: { user: this.user(), controller: this.controller, self_update: true },
    });
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

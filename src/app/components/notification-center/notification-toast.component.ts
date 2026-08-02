import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import type { AppNotification } from '@services/notification-center.service';
import { notificationIcon, notificationLabel } from './notification-presentation';

export interface NotificationToastData {
  notification: AppNotification;
}

@Component({
  selector: 'app-notification-toast',
  standalone: true,
  templateUrl: './notification-toast.component.html',
  styleUrl: './notification-toast.component.scss',
  imports: [MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationToastComponent {
  private readonly snackBarRef = inject(MatSnackBarRef<NotificationToastComponent>);
  readonly data = inject<NotificationToastData>(MAT_SNACK_BAR_DATA);
  readonly icon = notificationIcon;
  readonly label = notificationLabel;

  dismiss(): void {
    this.snackBarRef.dismiss();
  }
}

import { ChangeDetectionStrategy, Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { User } from '@models/users/user';
import { Controller } from '@models/controller';
import { AiProfileTabComponent } from '@components/user-management/user-detail/ai-profile-tab/ai-profile-tab.component';

export interface AiProfileDialogData {
  user: User;
  controller: Controller;
}

@Component({
  selector: 'app-ai-profile-dialog',
  standalone: true,
  templateUrl: './ai-profile-dialog.component.html',
  styleUrl: './ai-profile-dialog.component.scss',
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    AiProfileTabComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiProfileDialogComponent {
  private dialogRef = inject(MatDialogRef<AiProfileDialogComponent>);
  readonly data = inject(MAT_DIALOG_DATA) as AiProfileDialogData;

  close() {
    this.dialogRef.close();
  }
}

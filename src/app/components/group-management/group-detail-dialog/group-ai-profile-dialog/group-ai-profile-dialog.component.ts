import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Group } from '@models/groups/group';
import { Controller } from '@models/controller';
import { GroupAiProfileTabComponent } from '@components/group-details/group-ai-profile-tab/group-ai-profile-tab.component';

export interface GroupAiProfileDialogData {
  group: Group;
  controller: Controller;
}

@Component({
  selector: 'app-group-ai-profile-dialog',
  standalone: true,
  templateUrl: './group-ai-profile-dialog.component.html',
  styleUrl: './group-ai-profile-dialog.component.scss',
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    GroupAiProfileTabComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupAiProfileDialogComponent {
  private dialogRef = inject(MatDialogRef<GroupAiProfileDialogComponent>);
  readonly data = inject(MAT_DIALOG_DATA) as GroupAiProfileDialogData;

  close() {
    this.dialogRef.close();
  }
}

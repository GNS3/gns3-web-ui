import { ChangeDetectionStrategy, Component, Inject, OnInit, inject } from '@angular/core';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-nodes-menu-confirmation-dialog',
  templateUrl: './nodes-menu-confirmation-dialog.component.html',
  styleUrl: './nodes-menu-confirmation-dialog.component.scss',
  imports: [MatDialogModule, MatButtonModule, MatDividerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NodesMenuConfirmationDialogComponent implements OnInit {
  public dialogRef = inject(MatDialogRef<NodesMenuConfirmationDialogComponent>);

  confirmActionData = {
    actionType: 'start',
    isAction:false
  };

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}

  ngOnInit(): void {
    this.confirmActionData.actionType = this.data;
  }

  confirmAction() {
    this.confirmActionData.isAction = true
    this.dialogRef.close(this.confirmActionData);
  }
}

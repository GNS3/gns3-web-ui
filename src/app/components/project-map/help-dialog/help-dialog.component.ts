import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Message } from '@models/message';

@Component({
  standalone: false,
  selector: 'app-help-dialog',
  templateUrl: './help-dialog.component.html',
  styleUrls: ['./help-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HelpDialogComponent {
  @Input() title: string;
  @Input() messages: Message[];

  constructor(public dialogRef: MatDialogRef<HelpDialogComponent>) {}

  onCloseClick() {
    this.dialogRef.close();
  }
}

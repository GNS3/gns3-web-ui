import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Message } from '@models/message';

@Component({
  standalone: true,
  selector: 'app-help-dialog',
  templateUrl: './help-dialog.component.html',
  styleUrls: ['./help-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
})
export class HelpDialogComponent {
  public dialogRef = inject(MatDialogRef<HelpDialogComponent>);

  @Input() title: string;
  @Input() messages: Message[];

  onCloseClick() {
    this.dialogRef.close();
  }
}

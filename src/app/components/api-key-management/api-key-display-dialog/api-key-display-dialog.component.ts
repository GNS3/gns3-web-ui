import { ChangeDetectionStrategy, Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Clipboard } from '@angular/cdk/clipboard';
import { ApiKeyCreatedResponse } from '@models/api/api-key';
import { ToasterService } from '@services/toaster.service';

export interface ApiKeyDisplayDialogData {
  response: ApiKeyCreatedResponse;
}

@Component({
  selector: 'app-api-key-display-dialog',
  standalone: true,
  templateUrl: './api-key-display-dialog.component.html',
  styleUrl: './api-key-display-dialog.component.scss',
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApiKeyDisplayDialogComponent {
  private dialogRef = inject(MatDialogRef<ApiKeyDisplayDialogComponent>);
  private toasterService = inject(ToasterService);
  private clipboard = inject(Clipboard);

  constructor(@Inject(MAT_DIALOG_DATA) public data: ApiKeyDisplayDialogData) {}

  copyKey() {
    const key = this.data.response.api_key;
    const copied = this.clipboard.copy(key);
    if (copied) {
      this.toasterService.success('API key copied to clipboard');
    } else {
      this.toasterService.error('Failed to copy. Please copy the key manually.');
    }
  }

  onClose() {
    this.dialogRef.close();
  }
}

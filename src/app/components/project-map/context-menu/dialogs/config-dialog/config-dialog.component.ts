import { Component, Input } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-config-dialog',
    templateUrl: './config-dialog.component.html',
    styleUrls: ['./config-dialog.component.scss']
})
export class ConfigDialogComponent {
    constructor(
        public dialogRef: MatDialogRef<ConfigDialogComponent>,
    ) {}

    close(fileType: string) {
        this.dialogRef.close(fileType);
    }
}

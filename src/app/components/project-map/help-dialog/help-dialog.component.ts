import { Component, Input } from '@angular/core';
import { Message } from '../../../models/message';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-help-dialog',
    templateUrl: './help-dialog.component.html',
    styleUrls: ['./help-dialog.component.scss']
})
export class HelpDialogComponent {
    @Input() title: string;
    @Input() messages: Message[];

    constructor(
        public dialogRef: MatDialogRef<HelpDialogComponent>,
    ) {}

    onCloseClick() {
        this.dialogRef.close();
    }
}

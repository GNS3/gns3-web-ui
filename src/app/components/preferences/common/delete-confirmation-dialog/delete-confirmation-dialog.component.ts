import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';


@Component({
    selector: 'app-delete-confirmation-dialog',
    templateUrl: './delete-confirmation-dialog.component.html',
    styleUrls: ['./delete-confirmation-dialog.component.scss']
})
export class DeleteConfirmationDialogComponent implements OnInit {
    templateName: string = '';

    constructor(
        public dialogRef: MatDialogRef<DeleteConfirmationDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this.templateName = data['templateName'];
    }

    ngOnInit() {}

    onNoClick(): void {
        this.dialogRef.close(false);
    }
    
    onYesClick(): void {
        this.dialogRef.close(true);
    }
}

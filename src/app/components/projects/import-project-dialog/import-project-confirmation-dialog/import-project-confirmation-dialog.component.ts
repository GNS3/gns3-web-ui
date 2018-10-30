import { Component, OnInit, Inject, ViewChild } from '@angular/core';
import { MatStepper, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";
import { FileUploader, ParsedResponseHeaders, FileItem } from 'ng2-file-upload';
import { v4 as uuid } from 'uuid';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { Project } from '../../../../models/project';

@Component({
    selector: 'app-import-project-dialog',
    templateUrl: 'import-project-confirmation-dialog.component.html',
    styleUrls: ['import-project-confirmation-dialog.component.css']
})
export class ImportProjectConfirmationDialogComponent implements OnInit {
    private existingProject : Project;
    private confirmationMessage : string;
    private isOpen : boolean;
    constructor(
        public dialogRef: MatDialogRef<ImportProjectConfirmationDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ){
        this.existingProject = data['existingProject']
    }

    ngOnInit(){
        if(this.existingProject.status === "opened"){
            this.confirmationMessage = `Project ${this.existingProject.name} is open. You can not overwrite it.`
            this.isOpen = true;
        } else {
            this.confirmationMessage = `Project ${this.existingProject.name} already exist, overwrite it?`
        }
    }

    onNoClick() : void { 
        this.dialogRef.close(false);
    }

    onYesClick() : void {
        this.dialogRef.close(true);
    }
}

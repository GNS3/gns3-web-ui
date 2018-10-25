import { Component, OnInit, Inject, ViewChild } from '@angular/core';
import { MatStepper, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";
import { FileUploader, ParsedResponseHeaders, FileItem } from 'ng2-file-upload';
import { Server } from '../../../models/server';
import { v4 as uuid } from 'uuid';

@Component({
    selector: 'app-import-project-dialog',
    templateUrl: 'import-project-dialog.component.html',
    styleUrls: ['import-project-dialog.component.css'],
})
export class ImportProjectDialogComponent implements OnInit {
    uploader: FileUploader;
    server : Server;
    projectName : string;
    isImportEnabled : boolean = false;
    isFinishEnabled : boolean = false;
    errorMessage : string;

    @ViewChild('stepper') stepper: MatStepper;
  
    constructor(
      public dialogRef: MatDialogRef<ImportProjectDialogComponent>,
      @Inject(MAT_DIALOG_DATA) public data: any){}
  
    ngOnInit(){
      this.uploader = new FileUploader({});
      this.uploader.onAfterAddingFile = (file) => { file.withCredentials = false; };
    }
  
    uploadProjectFile(event) : void{
      this.projectName = event.target.files[0].name.split(".")[0];
      this.isImportEnabled = true;
    }
  
    onImportClick() : void{
      if(this.validateProjectName()){
        this.prepareUploadPath();
        this.stepper.selected.completed = true;
        this.stepper.next();
        let itemToUpload = this.uploader.queue[0];
        this.uploader.uploadItem(itemToUpload);

        this.uploader.onErrorItem = (item: FileItem, response: string, status: number, headers: ParsedResponseHeaders) => {
          this.errorMessage = response;
          this.isFinishEnabled = true;
        };

        this.uploader.onSuccessItem = (item: FileItem, response: string, status: number, headers: ParsedResponseHeaders) => {
          this.isFinishEnabled = true;
        };
      }
    }
  
    onNoClick() : void{
      this.uploader.cancelAll();
      this.dialogRef.close();
    }

    onFinishClick() : void{
      this.dialogRef.close();
    }

    onDeleteClick() : void{
      this.uploader.queue.pop();
      this.isImportEnabled = false;
      this.projectName = "";
    }

    prepareUploadPath() : void{
      let url = `http://${this.server.ip}:${this.server.port}/v2/projects/${uuid()}/import?name=${this.projectName}`;
      this.uploader.queue.forEach(elem => elem.url = url);
    }

    validateProjectName() : boolean{
      var pattern = new RegExp(/[~`!#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/);
      return !pattern.test(this.projectName);
    }
}

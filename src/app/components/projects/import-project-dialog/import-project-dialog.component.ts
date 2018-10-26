import { Component, OnInit, Inject, ViewChild } from '@angular/core';
import { MatStepper, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";
import { FileUploader, ParsedResponseHeaders, FileItem } from 'ng2-file-upload';
import { Server } from '../../../models/server';
import { v4 as uuid } from 'uuid';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';

export class Validator {
    static projectNameValidator(projectName) {
      var pattern = new RegExp(/[~`!#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/);

      if(!pattern.test(projectName.value)) {
        return null;
      }

      return { invalidName: true }
    }
}

@Component({
    selector: 'app-import-project-dialog',
    templateUrl: 'import-project-dialog.component.html',
    styleUrls: ['import-project-dialog.component.css']
})
export class ImportProjectDialogComponent implements OnInit {
    uploader: FileUploader;
    server : Server;
    isImportEnabled : boolean = false;
    isFinishEnabled : boolean = false;
    resultMessage : string = "The project is being imported... Please wait";
    projectNameForm: FormGroup;
    submitted: boolean = false;

    @ViewChild('stepper') stepper: MatStepper;
  
    constructor(
      public dialogRef: MatDialogRef<ImportProjectDialogComponent>,
      @Inject(MAT_DIALOG_DATA) public data: any,
      private formBuilder: FormBuilder){
        this.projectNameForm = this.formBuilder.group({
            projectName: new FormControl(null, [Validators.required, Validator.projectNameValidator])
          });
      }
  
    ngOnInit(){
      this.uploader = new FileUploader({});
      this.uploader.onAfterAddingFile = (file) => { file.withCredentials = false; };
    }

    get form() { 
        return this.projectNameForm.controls; 
    }
  
    uploadProjectFile(event) : void{
      this.projectNameForm.controls['projectName'].setValue(event.target.files[0].name.split(".")[0]);
      this.isImportEnabled = true;
    }
  
    onImportClick() : void{
      if (this.projectNameForm.invalid){
        this.submitted = true;
      } else {
        const url = this.prepareUploadPath();
        this.uploader.queue.forEach(elem => elem.url = url);

        this.stepper.selected.completed = true;
        this.stepper.next();

        const itemToUpload = this.uploader.queue[0];
        this.uploader.uploadItem(itemToUpload);

        this.uploader.onErrorItem = (item: FileItem, response: string, status: number, headers: ParsedResponseHeaders) => {
            this.resultMessage = response;
            this.isFinishEnabled = true;
        };

        this.uploader.onSuccessItem = (item: FileItem, response: string, status: number, headers: ParsedResponseHeaders) => {
            this.resultMessage = "Project was imported succesfully!";
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
      this.projectNameForm.controls['projectName'].setValue("");
    }

    prepareUploadPath() : string{
      const projectName = this.projectNameForm.controls['projectName'].value;
      return `http://${this.server.ip}:${this.server.port}/v2/projects/${uuid()}/import?name=${projectName}`;
    }
}

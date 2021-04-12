import { Component, OnInit, EventEmitter, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { Server } from '../../../../models/server';
import { v4 as uuid } from 'uuid';
import { ProjectNameValidator } from '../../../projects/models/projectNameValidator';
import { ToasterService } from '../../../../services/toaster.service';
import { TemplateService } from '../../../../services/template.service';
import { templateNameAsyncValidator } from '../../../../validators/template-name-async-validator';
import { Template } from '../../../../models/template';

@Component({
  selector: 'app-template-name-dialog',
  templateUrl: './template-name-dialog.component.html',
  styleUrls: ['./template-name-dialog.component.scss'],
  providers: [ProjectNameValidator],
})
export class TemplateNameDialogComponent implements OnInit {
  server: Server;
  templateNameForm: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<TemplateNameDialogComponent>,
    private router: Router,
    private dialog: MatDialog,
    private toasterService: ToasterService,
    private formBuilder: FormBuilder,
    private templateNameValidator: ProjectNameValidator,
    private templateService: TemplateService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit() {
    let name = this.data['name'];
    this.templateNameForm = this.formBuilder.group({
      templateName: new FormControl(
        name,
        [Validators.required, this.templateNameValidator.get],
        [templateNameAsyncValidator(this.server, this.templateService)]
      ),
    });

    setTimeout(() => {
      this.templateNameForm.controls['templateName'].markAsTouched();
    }, 100);
  }

  get form() {
    return this.templateNameForm.controls;
  }

  onAddClick(): void {
    if (this.templateNameForm.invalid) {
      this.toasterService.error('Please enter correct name for new template');
      return;
    }
    this.templateService.list(this.server).subscribe((templates: Template[]) => {
      const templateName = this.templateNameForm.controls['templateName'].value;
      let existingProject = templates.find((t) => t.name === templateName);

      if (existingProject) {
        this.toasterService.error('Template with this name exists');
      } else {
        this.dialogRef.close(this.templateNameForm.controls['templateName'].value);
      }
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  onKeyDown(event) {
    if (event.key === 'Enter') {
      this.onAddClick();
    }
  }
}

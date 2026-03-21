import { ChangeDetectionStrategy, Component, Inject, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { Controller } from '@models/controller';
import { Template } from '@models/template';
import { TemplateService } from '@services/template.service';
import { ToasterService } from '@services/toaster.service';
import { templateNameAsyncValidator } from '../../../../validators/template-name-async-validator';
import { ProjectNameValidator } from '../../../projects/models/projectNameValidator';

@Component({
  standalone: true,
  selector: 'app-template-name-dialog',
  templateUrl: './template-name-dialog.component.html',
  styleUrls: ['./template-name-dialog.component.scss'],
  providers: [ProjectNameValidator],
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  // TODO: This component has been partially migrated to be zoneless-compatible.
  // After testing, this should be updated to ChangeDetectionStrategy.OnPush.
  changeDetection: ChangeDetectionStrategy.Default,
})
export class TemplateNameDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<TemplateNameDialogComponent>);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private toasterService = inject(ToasterService);
  private formBuilder = inject(UntypedFormBuilder);
  private templateService = inject(TemplateService);
  private cdr = inject(ChangeDetectorRef);

  controller: Controller;
  templateNameForm: UntypedFormGroup;

  constructor(
    private templateNameValidator: ProjectNameValidator,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit() {
    let name = this.data['name'];
    this.templateNameForm = this.formBuilder.group({
      templateName: new UntypedFormControl(
        name,
        [Validators.required, this.templateNameValidator.get],
        [templateNameAsyncValidator(this.controller, this.templateService)]
      ),
    });

    setTimeout(() => {
      this.templateNameForm.controls['templateName'].markAsTouched();
      this.cdr.markForCheck();
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
    this.templateService.list(this.controller).subscribe((templates: Template[]) => {
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

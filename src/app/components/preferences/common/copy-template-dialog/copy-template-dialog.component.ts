import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface CopyTemplateDialogData {
  templateName: string;
}

@Component({
  selector: 'app-copy-template-dialog',
  templateUrl: './copy-template-dialog.component.html',
  styleUrl: './copy-template-dialog.component.scss',
  imports: [MatDialogModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CopyTemplateDialogComponent {
  readonly form;

  constructor(
    private dialogRef: MatDialogRef<CopyTemplateDialogComponent, string>,
    @Inject(MAT_DIALOG_DATA) public data: CopyTemplateDialogData,
    private fb: FormBuilder,
  ) {
    this.form = this.fb.nonNullable.group({
      templateName: [`Copy of ${data.templateName}`, Validators.required],
    });
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }
    this.dialogRef.close(this.form.getRawValue().templateName.trim());
  }

  cancel(): void {
    this.dialogRef.close();
  }
}

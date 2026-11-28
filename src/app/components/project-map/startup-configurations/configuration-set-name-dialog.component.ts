import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface ConfigurationSetNameData {
  title: string;
  confirmLabel: string;
  names: string[];
  name?: string;
}

@Component({
  standalone: true,
  selector: 'app-configuration-set-name-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()">
      <h2 mat-dialog-title>{{ data.title }}</h2>
      <mat-dialog-content>
        <mat-form-field appearance="outline">
          <mat-label>Configuration set name</mat-label>
          <input matInput formControlName="name" maxlength="80" autocomplete="off" />
          <mat-error>{{ name.errors?.['name'] }}</mat-error>
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-stroked-button type="button" (click)="dialogRef.close()">Cancel</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="name.invalid">{{ data.confirmLabel }}</button>
      </mat-dialog-actions>
    </form>
  `,
})
export class ConfigurationSetNameDialogComponent {
  readonly data = inject<ConfigurationSetNameData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<ConfigurationSetNameDialogComponent>);
  readonly name = new FormControl(this.data.name || '', {
    nonNullable: true,
    validators: [
      (control) => {
        const name = control.value.trim();
        if (!name) return { name: 'Enter a configuration set name.' };
        if (name.length > 80) return { name: 'Use 80 characters or fewer.' };
        if (/[\x00-\x1f]/.test(name)) return { name: 'Use a name without control characters.' };
        if (this.data.names.some((existing) => existing.toLowerCase() === name.toLowerCase())) {
          return { name: 'A configuration set with this name already exists.' };
        }
        return null;
      },
    ],
  });
  readonly form = new FormGroup({ name: this.name });

  submit() {
    if (this.name.valid) this.dialogRef.close(this.name.value.trim());
  }
}

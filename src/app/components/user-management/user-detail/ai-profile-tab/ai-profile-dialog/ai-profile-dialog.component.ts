import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, FormArray } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { AiProfile } from '@models/ai-profile';

export interface ProfileDialogData {
  mode: 'create' | 'edit';
  profile: Partial<AiProfile>;
  existingNames: string[];
}

export interface CustomField {
  key: string;
  value: string;
}

// Standard fields that are already in the form
const STANDARD_FIELDS = ['name', 'provider', 'model', 'api_key', 'base_url', 'temperature', 'max_tokens', 'top_p'];

@Component({
  selector: 'app-ai-profile-dialog',
  templateUrl: './ai-profile-dialog.component.html',
  styleUrls: ['./ai-profile-dialog.component.scss']
})
export class AiProfileDialogComponent implements OnInit {
  form: FormGroup;
  mode: 'create' | 'edit';
  existingNames: string[];
  customFields: CustomField[] = [];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AiProfileDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ProfileDialogData
  ) {
    this.mode = data.mode;
    this.existingNames = data.existingNames;
    this.form = this.createForm();
  }

  ngOnInit(): void {
    if (this.mode === 'edit' && this.data.profile) {
      this.form.patchValue(this.data.profile);

      // Extract custom fields (non-standard fields)
      this.customFields = Object.entries(this.data.profile)
        .filter(([key]) => !STANDARD_FIELDS.includes(key))
        .map(([key, value]) => ({ key, value: String(value) }));
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      name: [
        '',
        [
          Validators.required,
          Validators.minLength(1),
          Validators.maxLength(50),
          Validators.pattern(/^[a-zA-Z0-9_-]+$/)
        ]
      ],
      provider: ['', Validators.required],
      model: ['', Validators.required],
      api_key: ['', [Validators.required, Validators.minLength(10)]],
      base_url: [''],
      temperature: ['0.7', [Validators.min(0), Validators.max(2)]],
      max_tokens: [null],
      top_p: [null]
    }, { validators: this.nameUniqueValidator.bind(this) });
  }

  /**
   * Name uniqueness validator
   */
  private nameUniqueValidator(group: AbstractControl): ValidationErrors | null {
    const name = group.get('name')?.value;
    if (!name) return null;

    // Cannot use reserved name
    if (name.toLowerCase() === 'active') {
      return { reservedName: true };
    }

    // Cannot duplicate
    if (this.existingNames.includes(name)) {
      return { duplicateName: true };
    }

    return null;
  }

  /**
   * Get error message
   */
  getErrorMessage(field: string): string {
    const control = this.form.get(field);
    if (!control || !control.errors) return '';

    const errors = control.errors;
    const formErrors = this.form.errors;

    if (field === 'name') {
      if (errors.required) return 'Name is required';
      if (errors.minlength) return 'Name must be at least 1 character';
      if (errors.maxlength) return 'Name cannot exceed 50 characters';
      if (errors.pattern) return 'Name can only contain letters, numbers, underscores and hyphens';
      if (formErrors?.reservedName) return '"active" is a reserved name';
      if (formErrors?.duplicateName) return 'Name already exists';
      return 'Invalid name format';
    }

    if (field === 'api_key') {
      if (errors.required) return 'API Key is required';
      if (errors.minlength) return 'API Key is too short';
      return 'Invalid API Key format';
    }

    if (field === 'temperature') {
      if (errors.min) return 'Temperature cannot be less than 0';
      if (errors.max) return 'Temperature cannot be greater than 2';
      return 'Invalid temperature value';
    }

    if (errors.required) return 'This field is required';
    return 'Invalid format';
  }

  /**
   * Check if field has error
   */
  hasError(field: string): boolean {
    const control = this.form.get(field);
    return control ? control.invalid && (control.dirty || control.touched) : false;
  }

  /**
   * Add a new custom field
   */
  addCustomField(): void {
    this.customFields.push({ key: '', value: '' });
  }

  /**
   * Remove a custom field
   */
  removeCustomField(index: number): void {
    this.customFields.splice(index, 1);
  }

  /**
   * Track by function for custom fields
   */
  trackByFn(index: number, item: CustomField): string {
    return `${index}-${item.key}`;
  }

  /**
   * Submit form
   */
  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.value;

    // Clean empty values
    const profile: Partial<AiProfile> = {
      name: value.name,
      provider: value.provider,
      model: value.model,
      api_key: value.api_key,
      base_url: value.base_url || '',
      temperature: value.temperature.toString()
    };

    // Optional fields
    if (value.max_tokens) {
      profile.max_tokens = value.max_tokens;
    }
    if (value.top_p !== null && value.top_p !== undefined && value.top_p !== '') {
      profile.top_p = value.top_p;
    }

    // Add custom fields
    this.customFields.forEach(field => {
      if (field.key && field.key.trim() && field.value !== null && field.value !== undefined && field.value !== '') {
        profile[field.key.trim()] = field.value;
      }
    });

    this.dialogRef.close(profile);
  }

  /**
   * Cancel
   */
  onCancel(): void {
    this.dialogRef.close();
  }
}

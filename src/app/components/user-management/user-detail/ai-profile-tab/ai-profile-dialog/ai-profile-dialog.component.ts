import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { AiProfile } from '@models/ai-profile';

export interface ProfileDialogData {
  mode: 'create' | 'edit';
  profile: Partial<AiProfile>;
  existingNames: string[];
}

@Component({
  selector: 'app-ai-profile-dialog',
  templateUrl: './ai-profile-dialog.component.html',
  styleUrls: ['./ai-profile-dialog.component.scss']
})
export class AiProfileDialogComponent implements OnInit {
  form: FormGroup;
  mode: 'create' | 'edit';
  existingNames: string[];

  providers = [
    { value: 'openai', label: 'OpenAI' },
    { value: 'qwen', label: 'Qwen' },
    { value: 'anthropic', label: 'Anthropic' },
    { value: 'google', label: 'Google' },
    { value: 'custom', label: '自定义' }
  ];

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
      if (errors.required) return '名称不能为空';
      if (errors.minlength) return '名称至少需要 1 个字符';
      if (errors.maxlength) return '名称最多 50 个字符';
      if (errors.pattern) return '名称只能包含字母、数字、下划线和连字符';
      if (formErrors?.reservedName) return '"active" 是保留名称';
      if (formErrors?.duplicateName) return '名称已存在';
      return '名称格式不正确';
    }

    if (field === 'api_key') {
      if (errors.required) return 'API Key 不能为空';
      if (errors.minlength) return 'API Key 长度不足';
      return 'API Key 格式不正确';
    }

    if (field === 'temperature') {
      if (errors.min) return '温度值不能小于 0';
      if (errors.max) return '温度值不能大于 2';
      return '温度值格式不正确';
    }

    if (errors.required) return '此项不能为空';
    return '格式不正确';
  }

  /**
   * Check if field has error
   */
  hasError(field: string): boolean {
    const control = this.form.get(field);
    return control ? control.invalid && (control.dirty || control.touched) : false;
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

    this.dialogRef.close(profile);
  }

  /**
   * Cancel
   */
  onCancel(): void {
    this.dialogRef.close();
  }
}

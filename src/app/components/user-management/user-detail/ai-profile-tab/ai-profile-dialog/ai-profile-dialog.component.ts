import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
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

// Provider preset configuration
export interface ProviderPreset {
  id: string;
  label: string;
  provider: string;
  baseUrl: string;
  models: string[];
  defaultTemperature?: string;
}

// Provider presets (exactly from FlowNet-Lab)
export const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    id: 'custom',
    label: 'Custom (User Defined)',
    provider: 'openai',
    baseUrl: '',
    models: [],
    defaultTemperature: '0.3'
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    provider: 'openai',
    baseUrl: 'https://openrouter.ai/api/v1',
    models: [
      'deepseek/deepseek-v3.2',
      'x-ai/grok-3',
      'anthropic/claude-sonnet-4',
      'z-ai/glm-4.7',
      'openai/gpt-4o',
      'google/gemini-2.5-flash'
    ],
    defaultTemperature: '0.3'
  },
  {
    id: 'deepseek',
    label: 'DeepSeek',
    provider: 'deepseek',
    baseUrl: 'https://api.deepseek.com/v1',
    models: ['deepseek-chat', 'deepseek-coder'],
    defaultTemperature: '0.3'
  }
];

// Standard fields that are already in the form
const STANDARD_FIELDS = ['name', 'provider', 'model', 'api_key', 'base_url', 'temperature'];

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

  // Provider presets
  providerPresets = PROVIDER_PRESETS;
  selectedPresetId: string = 'custom';
  selectedPreset: ProviderPreset | null = null;
  useCustomModel: boolean = false;

  /**
   * Check if using a preset (not custom)
   */
  get isPresetSelected(): boolean {
    return this.selectedPresetId !== 'custom' && this.selectedPreset !== null;
  }

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

      // Try to find matching preset
      this.detectPresetFromProfile();
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
      temperature: ['0.3', [Validators.min(0), Validators.max(2)]]
    }, { validators: this.nameUniqueValidator.bind(this) });
  }

  /**
   * Detect preset from existing profile values
   */
  private detectPresetFromProfile(): void {
    const provider = this.form.get('provider')?.value;
    const baseUrl = this.form.get('base_url')?.value;

    // Find matching preset
    const matchingPreset = this.providerPresets.find(preset =>
      preset.id !== 'custom' &&
      preset.provider === provider &&
      preset.baseUrl === baseUrl
    );

    if (matchingPreset) {
      this.selectedPresetId = matchingPreset.id;
      this.selectedPreset = matchingPreset;
      this.setPresetMode(true);
    } else {
      this.selectedPresetId = 'custom';
      this.selectedPreset = null;
      this.setPresetMode(false);
    }
  }

  /**
   * Handle preset selection change
   */
  onPresetChange(presetId: string): void {
    this.selectedPresetId = presetId;
    this.selectedPreset = this.providerPresets.find(p => p.id === presetId) || null;

    if (this.selectedPreset && presetId !== 'custom') {
      // Auto-fill configuration from preset
      this.form.get('provider')?.setValue(this.selectedPreset.provider);
      this.form.get('base_url')?.setValue(this.selectedPreset.baseUrl);

      // Set first model as default
      if (this.selectedPreset.models.length > 0) {
        this.form.get('model')?.setValue(this.selectedPreset.models[0]);
        this.useCustomModel = false;
      }

      // Set default temperature from preset
      if (this.selectedPreset.defaultTemperature) {
        this.form.get('temperature')?.setValue(this.selectedPreset.defaultTemperature);
      }

      this.setPresetMode(true);
    } else {
      this.setPresetMode(false);
    }
  }

  /**
   * Set preset mode (enable/disable provider and base_url fields)
   */
  private setPresetMode(isPreset: boolean): void {
    if (isPreset) {
      this.form.get('provider')?.disable();
      this.form.get('base_url')?.disable();
    } else {
      this.form.get('provider')?.enable();
      this.form.get('base_url')?.enable();
    }
  }

  /**
   * Handle model selection change
   */
  onModelChange(modelValue: string): void {
    if (modelValue === '__custom__') {
      this.useCustomModel = true;
      this.form.get('model')?.setValue('');
    } else {
      this.useCustomModel = false;
      this.form.get('model')?.setValue(modelValue);
    }
  }

  /**
   * Name uniqueness validator
   */
  private nameUniqueValidator(group: AbstractControl): ValidationErrors | null {
    const name = group.get('name')?.value;
    if (!name) return null;

    if (name.toLowerCase() === 'active') {
      return { reservedName: true };
    }

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
  trackByFn(index: number, item: CustomField): number {
    return index;
  }

  /**
   * Submit form
   */
  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // Use getRawValue() to include disabled fields (provider, base_url when using presets)
    const value = this.form.getRawValue();

    const profile: Partial<AiProfile> = {
      name: value.name,
      provider: value.provider,
      model: value.model,
      api_key: value.api_key,
      base_url: value.base_url || '',
      temperature: value.temperature.toString()
    };

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

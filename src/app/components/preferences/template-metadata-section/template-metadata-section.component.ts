import { ChangeDetectionStrategy, Component, effect, inject, model, signal } from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApplianceMetadata } from '@models/appliance-metadata';

/** Metadata keys this section's form owns. appliance_id is read-only; the credential keys are edited in the General settings section and only preserved here. */
type KnownField =
  | 'description'
  | 'vendor_name'
  | 'vendor_url'
  | 'vendor_logo_url'
  | 'documentation_url'
  | 'product_name'
  | 'product_url'
  | 'status'
  | 'availability'
  | 'maintainer'
  | 'maintainer_email'
  | 'installation_instructions';

/** Form fields with their labels; link fields get an open-in-new suffix. */
const FORM_FIELDS: {
  field: KnownField;
  label: string;
  multiline?: boolean;
  link?: boolean;
  copy?: boolean;
  placeholder?: string;
}[] = [
  { field: 'description', label: 'Description', multiline: true },
  { field: 'vendor_name', label: 'Vendor name' },
  { field: 'vendor_url', label: 'Vendor URL', link: true, placeholder: 'https://…' },
  { field: 'vendor_logo_url', label: 'Vendor logo URL', link: true, placeholder: 'https://…' },
  { field: 'documentation_url', label: 'Documentation URL', link: true, placeholder: 'https://…' },
  { field: 'product_name', label: 'Product name' },
  { field: 'product_url', label: 'Product URL', link: true, placeholder: 'https://…' },
  { field: 'status', label: 'Status', placeholder: 'stable / experimental / broken' },
  { field: 'availability', label: 'Availability', placeholder: 'free / service-contract / …' },
  { field: 'maintainer', label: 'Maintainer' },
  { field: 'maintainer_email', label: 'Maintainer email' },
  { field: 'installation_instructions', label: 'Installation instructions', multiline: true },
];

/**
 * Appliance metadata form for the template details pages' Metadata tab. The
 * host page provides the __form-card surface and section header, and mounts
 * this component only while its tab is active; this component renders just
 * the edit form (fields in a two-column grid).
 *
 * The server semantics are whole-object replacement (PUT with the field
 * replaces, without it preserves, null clears), so this component owns the
 * read-modify-write: every input rebuilds the object from its own form
 * fields and PRESERVES every key it does not own — the credentials edited
 * in the General settings section, unknown/future keys the server may have
 * passed through — they are never shown or stripped here. Empty fields drop
 * their key; when everything is empty the model becomes null (clear). Null
 * and absent values behave identically (the server materializes unset keys
 * as null).
 *
 * Two-way bound via [(metadata)] to the parent dialog's signal; the parent
 * assigns it back onto the template object when saving.
 */
@Component({
  selector: 'app-template-metadata-section',
  standalone: true,
  templateUrl: 'template-metadata-section.component.html',
  styleUrls: ['template-metadata-section.component.scss'],
  imports: [MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplateMetadataSectionComponent {
  readonly metadata = model<ApplianceMetadata | null>(null);

  readonly fields = FORM_FIELDS;
  /** Edit-form values keyed by field name, synced from the metadata model. */
  readonly formValues = signal<{ [field: string]: string }>({});

  private readonly clipboard = inject(Clipboard);
  private readonly snackBar = inject(MatSnackBar);
  /** The object our own rebuild last emitted — distinguishes external metadata changes from ours. */
  private lastEmitted: ApplianceMetadata | null | undefined;

  constructor() {
    // Sync the form when the parent loads/reloads a template (external metadata set);
    // our own rebuilds are recognized by reference and don't reset the form.
    effect(() => {
      const metadata = this.metadata();
      if (metadata !== this.lastEmitted) {
        this.syncForm(metadata);
      }
    });
  }

  isTruthy(value: unknown): boolean {
    return value !== undefined && value !== null && value !== '';
  }

  text(field: KnownField): string {
    const value = this.metadata()?.[field];
    return this.isTruthy(value) ? String(value) : '';
  }

  openLink(field: KnownField) {
    const url = this.text(field);
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  copy(field: KnownField, label: string) {
    const value = this.text(field);
    if (!value) return;
    if (this.clipboard.copy(value)) {
      this.snackBar.open(`${label} copied to clipboard`, 'Close', { duration: 3000 });
    } else {
      this.snackBar.open(`Failed to copy. Please copy the ${label.toLowerCase()} manually.`, 'Close', { duration: 5000 });
    }
  }

  onInput(field: string, event: Event) {
    const value = (event.target as HTMLInputElement | HTMLTextAreaElement).value;
    this.setField(field, value);
  }

  setField(field: string, value: string) {
    this.formValues.update((values) => ({ ...values, [field]: value }));
    const rebuilt = this.rebuild();
    this.lastEmitted = rebuilt;
    this.metadata.set(rebuilt);
  }

  /** Clears the whole metadata (PUT null semantics) and empties the form. */
  remove() {
    this.lastEmitted = null;
    this.metadata.set(null);
    this.syncForm(null);
  }

  /** Rebuild the whole object: non-empty form fields + keys the form does not own, preserved untouched. */
  private rebuild(): ApplianceMetadata | null {
    const previous = this.metadata();
    const next: { [key: string]: unknown } = {};
    const values = this.formValues();
    for (const { field } of FORM_FIELDS) {
      const value = (values[field] || '').trim();
      if (value !== '') {
        next[field] = value;
      }
    }
    if (previous) {
      for (const [key, value] of Object.entries(previous)) {
        if (key === 'appliance_id') {
          if (this.isTruthy(value)) next[key] = value;
        } else if (!FORM_FIELDS.some((entry) => entry.field === key) && this.isTruthy(value)) {
          next[key] = value; // not owned by this form (credentials from General settings, unknown/future keys) — preserved untouched
        }
      }
    }
    return Object.keys(next).length > 0 ? (next as ApplianceMetadata) : null;
  }

  private syncForm(metadata: ApplianceMetadata | null) {
    const values: { [field: string]: string } = {};
    for (const { field } of FORM_FIELDS) {
      const value = metadata?.[field];
      values[field] = this.isTruthy(value) ? String(value) : '';
    }
    this.formValues.set(values);
  }
}

import { Directive, forwardRef } from '@angular/core';
import { DefaultValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * `input[type=color]` only accepts `#rrggbb` values. `DefaultValueAccessor`
 * writes `''` for a `null`/empty model (and forms sometimes start as `''`),
 * which the browser rejects with
 * "The specified value "" does not conform to the required format."
 * every single time the control is written — once per dialog open, reset and
 * edit-mode patch.
 *
 * This accessor keeps the model semantics ("no color picked" stays `null`) but
 * renders a placeholder swatch instead of writing an invalid value to the DOM.
 * Any user interaction still emits the picked `#rrggbb` as usual.
 */
@Directive({
  // Value accessors match by input type + form binding (like Angular's own
  // NumberValueAccessor) so every reactive color input is covered — the prefix
  // convention doesn't fit that pattern.
  /* eslint-disable-next-line @angular-eslint/directive-selector -- CVA type-matched selector, like Angular's own accessors */
  selector: 'input[type=color][formControlName],input[type=color][formControl],input[type=color][ngModel]',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SafeColorValueAccessor),
      multi: true,
    },
  ],
})
export class SafeColorValueAccessor extends DefaultValueAccessor {
  private static readonly HEX_COLOR = /^#[0-9a-f]{6}$/i;

  /** Swatch shown while the model has no color — the browser's own fallback. */
  static readonly PLACEHOLDER = '#000000';

  override writeValue(value: string | null): void {
    this.setProperty(
      'value',
      value && SafeColorValueAccessor.HEX_COLOR.test(value) ? value : SafeColorValueAccessor.PLACEHOLDER
    );
  }
}

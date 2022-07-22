import {AbstractControl, FormGroup, ValidationErrors, ValidatorFn} from '@angular/forms';


export function matchingPassword(control: AbstractControl) : ValidationErrors | null {
  if (control.get('password').value !== control.get('confirmPassword').value) {
    control.get('confirmPassword').setErrors({confirmPasswordMatch: true});
    return;
  }
  return;
}

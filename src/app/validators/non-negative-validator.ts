import { Injectable } from '@angular/core';

@Injectable()
export class NonNegativeValidator {
  get(control) {
    if (+control.value>=0) {
      return null;
    } 

    return { negativeValue: true };
  }
}

import { Injectable } from '@angular/core';

@Injectable()
export class RotationValidator {
  get(control) {
    if (+control.value>-360 && +control.value<=360) {
      return null;
    } 

    return { negativeValue: true };
  }
}

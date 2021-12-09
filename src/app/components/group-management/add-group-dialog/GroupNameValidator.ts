import { Injectable } from '@angular/core';

@Injectable()
export class GroupNameValidator {
  get(groupName) {
    const pattern = new RegExp(/[~`!#$%\^&*+=\[\]\\';,/{}|\\":<>\?]/);

    if (!pattern.test(groupName.value)) {
      return null;
    }

    return { invalidName: true };
  }
}

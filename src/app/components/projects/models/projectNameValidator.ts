import { Injectable } from '@angular/core';

@Injectable()
export class ProjectNameValidator {
  get(projectName) {
    const pattern = new RegExp(/[~`!#$%\^&*+=\[\]\\';,/{}|\\":<>\?]/);

    if (!pattern.test(projectName.value)) {
      return null;
    }

    return { invalidName: true };
  }
}

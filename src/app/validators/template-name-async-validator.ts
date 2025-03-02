import { UntypedFormControl } from '@angular/forms';
import { timer } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Controller } from '@models/controller';
import { TemplateService } from '@services/template.service';

export const templateNameAsyncValidator = (controller: Controller, templateService: TemplateService) => {
  return (control: UntypedFormControl) => {
    return timer(500).pipe(
      switchMap(() => templateService.list(controller)),
      map((response) => (response.find((n) => n.name === control.value) ? { templateExist: true } : null))
    );
  };
};

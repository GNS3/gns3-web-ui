import { UntypedFormControl } from '@angular/forms';
import { timer } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Controller } from '../models/controller';
import { ProjectService } from '../services/project.service';

export const projectNameAsyncValidator = (controller:Controller , projectService: ProjectService) => {
  return (control: UntypedFormControl) => {
    return timer(500).pipe(
      switchMap(() => projectService.list(controller)),
      map((response) => (response.find((n) => n.name === control.value) ? { projectExist: true } : null))
    );
  };
};

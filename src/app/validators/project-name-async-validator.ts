import { FormControl } from '@angular/forms';
import { timer } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Server } from '../models/server';
import { ProjectService } from '../services/project.service';

export const projectNameAsyncValidator = (controller: Server, projectService: ProjectService) => {
  return (control: FormControl) => {
    return timer(500).pipe(
      switchMap(() => projectService.list(controller)),
      map((response) => (response.find((n) => n.name === control.value) ? { projectExist: true } : null))
    );
  };
};

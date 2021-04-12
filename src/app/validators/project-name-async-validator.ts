import { ProjectService } from '../services/project.service';
import { FormControl } from '@angular/forms';
import { timer } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Server } from '../models/server';

export const projectNameAsyncValidator = (server: Server, projectService: ProjectService) => {
  return (control: FormControl) => {
    return timer(500).pipe(
      switchMap(() => projectService.list(server)),
      map((response) => (response.find((n) => n.name === control.value) ? { projectExist: true } : null))
    );
  };
};

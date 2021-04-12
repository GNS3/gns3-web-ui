import { FormControl } from '@angular/forms';
import { timer } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Server } from '../models/server';
import { TemplateService } from '../services/template.service';

export const templateNameAsyncValidator = (server: Server, templateService: TemplateService) => {
  return (control: FormControl) => {
    return timer(500).pipe(
      switchMap(() => templateService.list(server)),
      map((response) => (response.find((n) => n.name === control.value) ? { templateExist: true } : null))
    );
  };
};

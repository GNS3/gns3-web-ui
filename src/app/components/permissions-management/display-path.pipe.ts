import {Pipe, PipeTransform} from '@angular/core';
import {map, switchMap} from "rxjs/operators";
import {forkJoin, Observable, of} from "rxjs";
import {ApiInformationService} from "@services/api-information.service";
import {Server} from "@models/server";

@Pipe({
  name: 'displayPath'
})
export class DisplayPathPipe implements PipeTransform {

  constructor(private apiInformation: ApiInformationService) {
  }

  transform(originalPath: string, server: Server): Observable<string> {
    if (!server) {
      return of(originalPath);
    }
    return this.apiInformation
      .getKeysForPath(originalPath)
      .pipe(switchMap((values) => {
          if (values.length === 0) {
            return of([]);
          }
          const obs = values.map((k) => this.apiInformation.getListByObjectId(server, k.key, k.value, values));
          return forkJoin(obs);
        }),
        map((values: { id: string; name: string }[][]) => {
          let displayPath = `${originalPath}`;
          values.forEach((value) => {
            if (value[0].id && value[0].name) {
              displayPath = displayPath.replace(value[0].id, value[0].name);
            } else {
            }

          });
          return displayPath;
        })
      );
  }

}

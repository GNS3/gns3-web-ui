/*
* Software Name : GNS3 Web UI
* Version: 3
* SPDX-FileCopyrightText: Copyright (c) 2022 Orange Business Services
* SPDX-License-Identifier: GPL-3.0-or-later
*
* This software is distributed under the GPL-3.0 or any later version,
* the text of which is available at https://www.gnu.org/licenses/gpl-3.0.txt
* or see the "LICENSE" file for more details.
*
* Author: Sylvain MATHIEU, Elise LEBEAU
*/
import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable, ReplaySubject} from "rxjs";
import {map} from "rxjs/operators";
import {Methods} from "@models/api/permission";

export interface IPathDict {
  methods: ('POST' | 'GET' | 'PUT' | 'DELETE' | 'HEAD' | 'PATH')[];
  originalPath: string;
  path: string;
  subPaths: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ApiInformationService {
  private data: ReplaySubject<IPathDict[]> = new ReplaySubject<IPathDict[]>(1);

  constructor(private httpClient: HttpClient) {
    this.loadLocalInformation();

    this.data.subscribe((data) => {
      localStorage.setItem('api-definition', JSON.stringify(data));
    });


    this.httpClient
      .get(`https://apiv3.gns3.net/openapi.json`)
      .subscribe((openapi: any) => {
        const data = this.apiModelAdapter(openapi);
        this.data.next(data);
      });

  }

  private apiModelAdapter(openapi: any): IPathDict[] {

    const keys = Object.keys(openapi.paths);
    return keys
      .map(path => {
        const subPaths = path.split('/').filter(elem => !(elem === '' || elem === 'v3'));
        return {originalPath: path, path: subPaths.join('/'), subPaths};
      })
      .map(path => {
        //FIXME
        // @ts-ignore
        const methods = Object.keys(openapi.paths[path.originalPath]);
        return {methods: methods.map(m => m.toUpperCase()), ...path};

      }) as unknown as IPathDict[];
  }


  getMethods(path: string): Observable<Methods[]> {
    return this.getPath(path)
      .pipe(
        map((data: IPathDict[]) => {
          const availableMethods = new Set<string>();

          data.forEach((p: IPathDict) => {
            p.methods.forEach(method => availableMethods.add(method));
          });
          return Array.from(availableMethods) as Methods[];
        }),
      );
  }

  getPath(path: string): Observable<IPathDict[]> {
    return this.data
      .asObservable()
      .pipe(
        map((data) => {

          const splinted = path.split('/').filter(elem => !(elem === '' || elem === 'v3'));
          let remains = data;
          splinted.forEach((value, index) => {
            if (value === '*') {
              return remains;
            }
            remains = remains.filter((val => {
              if (!val.subPaths[index]) {
                return false;
              }
              if (val.subPaths[index].includes('{')) {
                return true;
              }
              return val.subPaths[index] === value;
            }));
          });

          return remains;
        })
      );
  }

  private loadLocalInformation() {
    const data = JSON.parse(localStorage.getItem('api-definition'));
    if (data) {
      this.data.next(data);
    }
  }
}

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
import {Observable, of, ReplaySubject} from "rxjs";
import {map, switchMap, take, tap} from "rxjs/operators";
import {Methods} from "app/models/api/permission";
import {HttpServer} from "app/services/http-server.service";
import {Server} from "app/models/server";
import {GetObjectIdHelper} from "@services/ApiInformation/GetObjectIdHelper";
import {IExtraParams} from "@services/ApiInformation/IExtraParams";
import {ApiInformationCache} from "@services/ApiInformation/ApiInformationCache";
import {IGenericApiObject} from "@services/ApiInformation/IGenericApiObject";

export interface IPathDict {
  methods: ('POST' | 'GET' | 'PUT' | 'DELETE' | 'HEAD' | 'PATH')[];
  originalPath: string;
  path: string;
  subPaths: string[];
}

export interface IApiObject {
  name: string;
  path: string;
}

export interface IQueryObject {
  id: string;
  text: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ApiInformationService {

  private cache = new ApiInformationCache();
  private allowed = ['projects', 'images', 'templates', 'computes', 'symbols', 'notifications'];
  private data: ReplaySubject<IPathDict[]> = new ReplaySubject<IPathDict[]>(1);
  private objs: ReplaySubject<IApiObject[]> = new ReplaySubject<IApiObject[]>(1);
  public readonly bracketIdRegex = new RegExp("\{(.*?)\}", 'g');
  public readonly uuidRegex = new RegExp("[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}");
  public readonly finalBracketIdRegex = new RegExp("\{(.*?)\}$");


  constructor(private httpClient: HttpClient) {
    this.loadLocalInformation();

    this.data.subscribe((data) => {
      localStorage.setItem('api-definition', JSON.stringify(data));
    });

    this.objs.subscribe((data) => {
      localStorage.setItem('api-definition-objs', JSON.stringify(data));
    });


    this.httpClient
      .get(`https://apiv3.gns3.net/openapi.json`)
      .subscribe((openapi: any) => {
        const objs = this.apiObjectModelAdapter(openapi);
        const data = this.apiPathModelAdapter(openapi);
        this.data.next(data);
        this.objs.next(objs);
      });

  }

  private apiObjectModelAdapter(openapi: any): IApiObject[] {

    function haveGetMethod(path: string): boolean {
      const obj = openapi.paths[path];
      if (obj) {
        const methods = Object.keys(obj);
        return methods.includes("get");
      } else {
        return false;
      }
    }

    function extractId(originalPath: string): IApiObject {
      const d = originalPath.split('/');

      const name = d.pop();
      const path = d.join('/');

      return {name, path};
    }

    const keys = Object.keys(openapi.paths);
    return keys
      .filter((path: string) => path.match(this.finalBracketIdRegex))
      .filter(haveGetMethod)
      .map(extractId)
      .filter((object) => haveGetMethod(object.path));
  }

  private apiPathModelAdapter(openapi: any): IPathDict[] {
    const keys = Object.keys(openapi.paths);
    return keys
      .map(path => {
        const subPaths = path.split('/').filter(elem => !(elem === '' || elem === 'v3'));
        return {originalPath: path, path: subPaths.join('/'), subPaths};
      })
      .filter(d => this.allowed.includes(d.subPaths[0]))
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
          const splinted = path
            .split('/')
            .filter(elem => !(elem === '' || elem === 'v3'));
          let remains = data;
          splinted.forEach((value, index) => {
            if (value === '*') {
              return;
            }
            let matchUrl = remains.filter(val => val.subPaths[index]?.includes(value));

            if (matchUrl.length === 0) {
              matchUrl = remains.filter(val => val.subPaths[index]?.match(this.bracketIdRegex));
            }
            remains = matchUrl;
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
    const obj = JSON.parse(localStorage.getItem('api-definition-objs'));
    if (obj) {
      this.objs.next(obj);
    }
  }

  getPathNextElement(path: string[]): Observable<string[]> {

    return this.getPath(path.join('/'))
      .pipe(map((paths: IPathDict[]) => {
        const set = new Set<string>();
        paths.forEach((p) => {
          if (p.subPaths[path.length]) {
            set.add(p.subPaths[path.length]);
          }
        });

        return Array.from(set);
      }));
  }

  getKeysForPath(path: string): Observable<{ key: string; value: string }[]> {
    return this.getPath(path)
      .pipe(map((paths: IPathDict[]) => {
        const splinted = path
          .split('/')
          .filter(elem => !(elem === '' || elem === 'v3'));
        return paths[0].subPaths.map((elem, index) => {
          if (elem.match(this.bracketIdRegex)) {

            return {key: elem, value: splinted[index]};
          }
        });
      }), map((values) => {
        return values.filter((v) => v !== undefined);
      }));
  }

  getListByObjectId(server: Server, key: string, value?: string, extraParams?: IExtraParams[]) {

    const cachedData = this.cache.get(server, key, value, extraParams);
    if (cachedData) {
      return of(cachedData);
    }

    return this.objs.pipe(
      map(GetObjectIdHelper.findElementInObjectListFn(key)),
      map(GetObjectIdHelper.buildRequestURL(server, value, extraParams)),
      switchMap(url => this.httpClient.get<any[]>(url, {headers: {Authorization: `Bearer ${server.authToken}`}})),
      switchMap(GetObjectIdHelper.createResponseObject(key, extraParams, this, server)),
      tap(data => this.cache.update(server, key, value, extraParams, data)),
      take(1));
  }

  getIdByObjNameFromCache(name: string): IGenericApiObject[] {
    return this.cache.searchByName(name);
  }
}



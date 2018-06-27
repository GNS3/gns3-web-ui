import { Injectable } from '@angular/core';
import {HttpHeaders, HttpClient, HttpParams} from '@angular/common/http';
import { Observable } from 'rxjs/Observable';

import {Server} from "../models/server";


/* tslint:disable:interface-over-type-literal */
export type JsonOptions = {
  headers?: HttpHeaders | {
      [header: string]: string | string[];
  };
  observe?: 'body';
  params?: HttpParams | {
      [param: string]: string | string[];
  };
  reportProgress?: boolean;
  responseType?: 'json';
  withCredentials?: boolean;
};

export type TextOptions = {
  headers?: HttpHeaders | {
      [header: string]: string | string[];
  };
  observe?: 'body';
  params?: HttpParams | {
      [param: string]: string | string[];
  };
  reportProgress?: boolean;
  responseType: 'text';
  withCredentials?: boolean;
};

export type HeadersOptions = {
    headers?: HttpHeaders | {
        [header: string]: string | string[];
    };
};
/* tslint:enable:interface-over-type-literal */


@Injectable()
export class HttpServer {

  constructor(private http: HttpClient) { }

  get<T>(server: Server, url: string, options?: JsonOptions): Observable<T> {
    options = this.getJsonOptions(options);
    const intercepted = this.getOptionsForServer<JsonOptions>(server, url, options);
    return this.http.get<T>(intercepted.url, intercepted.options as JsonOptions);
  }

  getText(server: Server, url: string, options?: TextOptions): Observable<string> {
    options = this.getTextOptions(options);
    const intercepted = this.getOptionsForServer<TextOptions>(server, url, options);
    return this.http.get(intercepted.url, intercepted.options as TextOptions);
  }

  post<T>(server: Server, url: string, body: any | null, options?: JsonOptions): Observable<T> {
    options = this.getJsonOptions(options);
    const intercepted = this.getOptionsForServer(server, url, options);
    return this.http.post<T>(intercepted.url, body, intercepted.options);
  }

  put<T>(server: Server, url: string, body: any, options?: JsonOptions): Observable<T> {
    options = this.getJsonOptions(options);
    const intercepted = this.getOptionsForServer(server, url, options);
    return this.http.put<T>(intercepted.url, body, intercepted.options);
  }

  delete<T>(server: Server, url: string, options?: JsonOptions): Observable<T> {
    options = this.getJsonOptions(options);
    const intercepted = this.getOptionsForServer(server, url, options);
    return this.http.delete<T>(intercepted.url, intercepted.options);
  }

  patch<T>(server: Server, url: string, body: any, options?: JsonOptions): Observable<T> {
    options = this.getJsonOptions(options);
    const intercepted = this.getOptionsForServer(server, url, options);
    return this.http.patch<T>(intercepted.url, body, intercepted.options);
  }

  head<T>(server: Server, url: string, options?: JsonOptions): Observable<T> {
    options = this.getJsonOptions(options);
    const intercepted = this.getOptionsForServer(server, url, options);
    return this.http.head<T>(intercepted.url, intercepted.options);
  }

  options<T>(server: Server, url: string, options?: JsonOptions): Observable<T> {
    options = this.getJsonOptions(options);
    const intercepted = this.getOptionsForServer(server, url, options);
    return this.http.options<T>(intercepted.url, intercepted.options);
  }

  private getJsonOptions(options: JsonOptions): JsonOptions {
    if (!options) {
      return {
        responseType: "json"
      };
    }
    return options;
  }

  private getTextOptions(options: TextOptions): TextOptions {
    if (!options) {
      return {
        responseType: "text"
      };
    }
    return options;
  }

  private getOptionsForServer<T extends HeadersOptions>(server: Server, url: string, options: T) {
    if (server.ip && server.port) {
      url = `http://${server.ip}:${server.port}/v2${url}`;
    } else {
      url = `/v2${url}`;
    }

    if (!options.headers) {
      options.headers = {};
    }

    if (server.authorization === "basic") {
      const credentials = btoa(`${server.login}:${server.password}`);
      options.headers['Authorization'] = `Basic ${credentials}`;
    }

    return {
      url: url,
      options: options
    };
  }

}

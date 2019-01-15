import { Injectable } from '@angular/core';
import { HttpHeaders, HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';

import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { Server } from '../models/server';

/* tslint:disable:interface-over-type-literal */
export type JsonOptions = {
  headers?:
    | HttpHeaders
    | {
        [header: string]: string | string[];
      };
  observe?: 'body';
  params?:
    | HttpParams
    | {
        [param: string]: string | string[];
      };
  reportProgress?: boolean;
  responseType?: 'json';
  withCredentials?: boolean;
};

export type TextOptions = {
  headers?:
    | HttpHeaders
    | {
        [header: string]: string | string[];
      };
  observe?: 'body';
  params?:
    | HttpParams
    | {
        [param: string]: string | string[];
      };
  reportProgress?: boolean;
  responseType: 'text';
  withCredentials?: boolean;
};

export type HeadersOptions = {
  headers?:
    | HttpHeaders
    | {
        [header: string]: string | string[];
      };
};
/* tslint:enable:interface-over-type-literal */

export class ServerError extends Error {
  public originalError: Error;

  constructor(message: string) {
    super(message);
  }

  static fromError(message: string, originalError: Error) {
    const serverError = new ServerError(message);
    serverError.originalError = originalError;
    return serverError;
  }
}

@Injectable()
export class ServerErrorHandler {
  handleError(error: HttpErrorResponse) {
    let err: Error = error;

    if (error.name === 'HttpErrorResponse' && error.status === 0) {
      err = ServerError.fromError('Server is unreachable', error);
    }

    return throwError(err);
  }
}

@Injectable()
export class HttpServer {
  constructor(private http: HttpClient, private errorHandler: ServerErrorHandler) {}

  get<T>(server: Server, url: string, options?: JsonOptions): Observable<T> {
    options = this.getJsonOptions(options);
    const intercepted = this.getOptionsForServer<JsonOptions>(server, url, options);
    return this.http
      .get<T>(intercepted.url, intercepted.options as JsonOptions)
      .pipe(catchError<T, any>(this.errorHandler.handleError));
  }

  getText(server: Server, url: string, options?: TextOptions): Observable<string> {
    options = this.getTextOptions(options);
    const intercepted = this.getOptionsForServer<TextOptions>(server, url, options);
    return this.http
      .get(intercepted.url, intercepted.options as TextOptions)
      .pipe(catchError(this.errorHandler.handleError));
  }

  post<T>(server: Server, url: string, body: any | null, options?: JsonOptions): Observable<T> {
    options = this.getJsonOptions(options);
    const intercepted = this.getOptionsForServer(server, url, options);
    return this.http
      .post<T>(intercepted.url, body, intercepted.options)
      .pipe(catchError<T, any>(this.errorHandler.handleError));
  }

  put<T>(server: Server, url: string, body: any, options?: JsonOptions): Observable<T> {
    options = this.getJsonOptions(options);
    const intercepted = this.getOptionsForServer(server, url, options);
    return this.http
      .put<T>(intercepted.url, body, intercepted.options)
      .pipe(catchError<T, any>(this.errorHandler.handleError));
  }

  delete<T>(server: Server, url: string, options?: JsonOptions): Observable<T> {
    options = this.getJsonOptions(options);
    const intercepted = this.getOptionsForServer(server, url, options);
    return this.http
      .delete<T>(intercepted.url, intercepted.options)
      .pipe(catchError<T, any>(this.errorHandler.handleError));
  }

  patch<T>(server: Server, url: string, body: any, options?: JsonOptions): Observable<T> {
    options = this.getJsonOptions(options);
    const intercepted = this.getOptionsForServer(server, url, options);
    return this.http
      .patch<T>(intercepted.url, body, intercepted.options)
      .pipe(catchError<T, any>(this.errorHandler.handleError));
  }

  head<T>(server: Server, url: string, options?: JsonOptions): Observable<T> {
    options = this.getJsonOptions(options);
    const intercepted = this.getOptionsForServer(server, url, options);
    return this.http
      .head<T>(intercepted.url, intercepted.options)
      .pipe(catchError<T, any>(this.errorHandler.handleError));
  }

  options<T>(server: Server, url: string, options?: JsonOptions): Observable<T> {
    options = this.getJsonOptions(options);
    const intercepted = this.getOptionsForServer(server, url, options);
    return this.http
      .options<T>(intercepted.url, intercepted.options)
      .pipe(catchError<T, any>(this.errorHandler.handleError));
  }

  private getJsonOptions(options: JsonOptions): JsonOptions {
    if (!options) {
      return {
        responseType: 'json'
      };
    }
    return options;
  }

  private getTextOptions(options: TextOptions): TextOptions {
    if (!options) {
      return {
        responseType: 'text'
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

    if (server.authorization === 'basic') {
      const credentials = btoa(`${server.login}:${server.password}`);
      options.headers['Authorization'] = `Basic ${credentials}`;
    }

    return {
      url: url,
      options: options
    };
  }
}

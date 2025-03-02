import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { EventEmitter, Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {Controller, ControllerProtocol } from '../models/controller';

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

export type BlobOptions = {
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
  responseType: 'blob';
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

export class ControllerError extends Error {
  public originalError: Error;

  constructor(message: string) {
    super(message);
  }

  static fromError(message: string, originalError: Error) {
    const controllerError = new ControllerError(message);
    controllerError.originalError = originalError;
    return controllerError;
  }
}

@Injectable()
export class ControllerErrorHandler {
  handleError(error: HttpErrorResponse) {
    let err: Error = error;

    if (error.name === 'HttpErrorResponse' && error.status === 0) {
      err = ControllerError.fromError('Controller is unreachable', error);
    }

    if (error.status === 401) {
      window.location.reload();
    }

    return throwError(err);
  }
}

@Injectable()
export class HttpController {
  public requestsNotificationEmitter = new EventEmitter<string>();

  constructor(private http: HttpClient, private errorHandler: ControllerErrorHandler) {}

  get<T>(controller: Controller, url: string, options?: JsonOptions): Observable<T> {
    options = this.getJsonOptions(options);
    const intercepted = this.getOptionsForController<JsonOptions>(controller, url, options);
    this.requestsNotificationEmitter.emit(`GET ${intercepted.url}`);

    return this.http
      .get<T>(intercepted.url, intercepted.options as JsonOptions)
      .pipe(catchError<T, any>(this.errorHandler.handleError)) as Observable<T>;
  }

  getText(controller: Controller, url: string, options?: TextOptions): Observable<string> {
    options = this.getTextOptions(options);
    const intercepted = this.getOptionsForController<TextOptions>(controller, url, options);
    this.requestsNotificationEmitter.emit(`GET ${intercepted.url}`);

    return this.http
      .get(intercepted.url, intercepted.options as TextOptions)
      .pipe(catchError(this.errorHandler.handleError));
  }

  getBlob(controller: Controller, url: string, options?: BlobOptions): Observable<Blob> {
    options = this.getBlobOptions(options);
    const intercepted = this.getOptionsForController<BlobOptions>(controller, url, options);
    this.requestsNotificationEmitter.emit(`GET ${intercepted.url}`);

    return this.http
      .get(intercepted.url, intercepted.options as BlobOptions)
      .pipe(catchError(this.errorHandler.handleError));
  }

  post<T>(controller: Controller, url: string, body: any | null, options?: JsonOptions): Observable<T> {
    options = this.getJsonOptions(options);
    const intercepted = this.getOptionsForController(controller, url, options);
    this.requestsNotificationEmitter.emit(`POST ${intercepted.url}`);

    return this.http
      .post<T>(intercepted.url, body, intercepted.options)
      .pipe(catchError<T, any>(this.errorHandler.handleError)) as Observable<T>;
  }

  put<T>(controller: Controller, url: string, body: any, options?: JsonOptions): Observable<T> {
    options = this.getJsonOptions(options);
    const intercepted = this.getOptionsForController(controller, url, options);
    this.requestsNotificationEmitter.emit(`PUT ${intercepted.url}`);

    return this.http
      .put<T>(intercepted.url, body, intercepted.options)
      .pipe(catchError<T, any>(this.errorHandler.handleError)) as Observable<T>;
  }

  delete<T>(controller: Controller, url: string, options?: JsonOptions): Observable<T> {
    options = this.getJsonOptions(options);
    const intercepted = this.getOptionsForController(controller, url, options);
    this.requestsNotificationEmitter.emit(`DELETE ${intercepted.url}`);

    return this.http
      .delete<T>(intercepted.url, intercepted.options)
      .pipe(catchError<T, any>(this.errorHandler.handleError)) as Observable<T>;
  }

  patch<T>(controller: Controller, url: string, body: any, options?: JsonOptions): Observable<T> {
    options = this.getJsonOptions(options);
    const intercepted = this.getOptionsForController(controller, url, options);
    return this.http
      .patch<T>(intercepted.url, body, intercepted.options)
      .pipe(catchError<T, any>(this.errorHandler.handleError)) as Observable<T>;
  }

  head<T>(controller: Controller, url: string, options?: JsonOptions): Observable<T> {
    options = this.getJsonOptions(options);
    const intercepted = this.getOptionsForController(controller, url, options);
    return this.http
      .head<T>(intercepted.url, intercepted.options)
      .pipe(catchError<T, any>(this.errorHandler.handleError)) as Observable<T>;
  }

  options<T>(controller: Controller, url: string, options?: JsonOptions): Observable<T> {
    options = this.getJsonOptions(options);
    const intercepted = this.getOptionsForController(controller, url, options);
    return this.http
      .options<T>(intercepted.url, intercepted.options)
      .pipe(catchError<T, any>(this.errorHandler.handleError)) as Observable<T>;
  }

  private getJsonOptions(options: JsonOptions): JsonOptions {
    if (!options) {
      return {
        responseType: 'json',
      };
    }
    return options;
  }

  private getTextOptions(options: TextOptions): TextOptions {
    if (!options) {
      return {
        responseType: 'text',
      };
    }
    return options;
  }

  private getBlobOptions(options: BlobOptions): BlobOptions {
    if (!options) {
      return {
        responseType: 'blob',
      };
    }
    return options;
  }

  private getOptionsForController<T extends HeadersOptions>(controller: Controller, url: string, options: T) {
    if (controller && controller.host && controller.port) {
      if (!controller.protocol) {
        controller.protocol = location.protocol as ControllerProtocol;
      }
      url = `${controller.protocol}//${controller.host}:${controller.port}/${environment.current_version}${url}`;
    } else {
      url = `/${environment.current_version}${url}`;
    }

    if (!options.headers) {
      options.headers = {};
    }

    if (controller && controller.authToken && !controller.tokenExpired) {
      options.headers['Authorization'] = `Bearer ${controller.authToken}`;
    }

    return {
      url: url,
      options: options,
    };
  }
}

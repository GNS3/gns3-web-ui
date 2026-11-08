import { HttpClient, HttpErrorResponse, HttpEvent, HttpHeaders, HttpParams, HttpRequest } from '@angular/common/http';
import { EventEmitter, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from 'environments/environment';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { Controller, ControllerProtocol } from '@models/controller';
import { AuthResponse } from '@models/authResponse';
import { ToasterService } from '@services/toaster.service';

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
  // 403 toast throttling: batch operations (e.g. "start all" denied for
  // every node) trigger one 403 per request — show a single toast.
  private static readonly FORBIDDEN_TOAST_THROTTLE_MS = 3000;
  private lastForbiddenMessage: string | null = null;
  private lastForbiddenToastAt = 0;

  constructor(private toaster: ToasterService) {}

  handleError(error: HttpErrorResponse, url?: string) {
    let err: Error = error;

    if (error.name === 'HttpErrorResponse' && error.status === 0) {
      err = ControllerError.fromError('Controller is unreachable', error);
    } else if (error.error?.message) {
      err = ControllerError.fromError(error.error.message, error);
    }

    //if (error.status === 401) {
    //  window.location.reload();
    //}

    // The flattened privilege list can overestimate (a privilege granted
    // on one resource path does not grant it everywhere): whenever the
    // server denies an action the UI offered, report it uniformly.
    if (error.status === 403 && !this.isAuthEndpoint(url)) {
      this.notifyForbidden(error);
    }

    return throwError(() => err);
  }

  private isAuthEndpoint(url?: string): boolean {
    if (!url) {
      return false;
    }
    return (
      url.endsWith('/access/users/login') ||
      url.endsWith('/access/users/authenticate') ||
      url.endsWith('/access/users/refresh')
    );
  }

  private notifyForbidden(error: HttpErrorResponse): void {
    const message = error.error?.message || 'Permission denied';
    const now = Date.now();
    if (message === this.lastForbiddenMessage && now - this.lastForbiddenToastAt < ControllerErrorHandler.FORBIDDEN_TOAST_THROTTLE_MS) {
      return;
    }
    this.lastForbiddenMessage = message;
    this.lastForbiddenToastAt = now;
    this.toaster.error(message);
  }
}

@Injectable()
export class HttpController {
  public requestsNotificationEmitter = new EventEmitter<string>();

  // Refresh token state
  private isRefreshing = false;
  private failedQueue: { resolve: () => void; reject: (error: unknown) => void }[] = [];

  constructor(
    private http: HttpClient,
    private errorHandler: ControllerErrorHandler,
    private router: Router,
  ) {}

  get<T>(controller: Controller, url: string, options?: JsonOptions): Observable<T> {
    options = this.getJsonOptions(options);
    const intercepted = this.getOptionsForController<JsonOptions>(controller, url, options);
    this.requestsNotificationEmitter.emit(`GET ${intercepted.url}`);

    return this.handleResponse<T>(
      controller,
      this.http.get<T>(intercepted.url, intercepted.options as JsonOptions),
      'GET', url, null, options
    );
  }

  getText(controller: Controller, url: string, options?: TextOptions): Observable<string> {
    options = this.getTextOptions(options);
    const intercepted = this.getOptionsForController<TextOptions>(controller, url, options);
    this.requestsNotificationEmitter.emit(`GET ${intercepted.url}`);

    return this.handleResponse<string>(
      controller,
      this.http.get(intercepted.url, intercepted.options as TextOptions),
      'GET', url, null, options
    );
  }

  getBlob(controller: Controller, url: string, options?: BlobOptions): Observable<Blob> {
    options = this.getBlobOptions(options);
    const intercepted = this.getOptionsForController<BlobOptions>(controller, url, options);
    this.requestsNotificationEmitter.emit(`GET ${intercepted.url}`);

    return this.handleResponse<Blob>(
      controller,
      this.http.get(intercepted.url, intercepted.options as BlobOptions),
      'GET', url, null, options
    );
  }

  post<T>(controller: Controller, url: string, body: any | null, options?: JsonOptions): Observable<T> {
    options = this.getJsonOptions(options);
    const intercepted = this.getOptionsForController(controller, url, options);
    this.requestsNotificationEmitter.emit(`POST ${intercepted.url}`);

    return this.handleResponse<T>(
      controller,
      this.http.post<T>(intercepted.url, body, intercepted.options),
      'POST', url, body, options
    );
  }

  postBlob(controller: Controller, url: string, body: Blob): Observable<Blob> {
    const options: BlobOptions = {
      responseType: 'blob',
      headers: {},
    };
    const intercepted = this.getOptionsForController<BlobOptions>(controller, url, options);
    this.requestsNotificationEmitter.emit(`POST ${intercepted.url}`);

    return this.handleResponse<Blob>(
      controller,
      this.http.post(intercepted.url, body, intercepted.options),
      'POST', url, body, options
    );
  }

  /**
   * Upload a file as a raw request body while exposing progress events
   * (`HttpEventType.UploadProgress` for the byte transfer, `HttpEventType.Response`
   * when the server replies). Use for endpoints that stream `request` bodies
   * (e.g. image uploads, `docker images/load`). Endpoints accepting multipart
   * form data are not supported; wrap the file in `FormData` at the call site
   * if that is ever needed.
   */
  postFile(controller: Controller, url: string, file: Blob, options?: TextOptions): Observable<HttpEvent<unknown>> {
    const opts = this.getTextOptions(options);
    opts.reportProgress = true;
    const intercepted = this.getOptionsForController<TextOptions>(controller, url, opts);
    this.requestsNotificationEmitter.emit(`POST ${intercepted.url}`);

    const request = new HttpRequest('POST', intercepted.url, file, {
      // getOptionsForController always leaves headers as a plain record.
      headers: new HttpHeaders(intercepted.options.headers as { [name: string]: string }),
      reportProgress: true,
      responseType: 'text',
    });

    return this.handleResponse<HttpEvent<unknown>>(
      controller,
      this.http.request(request),
      'POST', url, file, opts
    );
  }

  put<T>(controller: Controller, url: string, body: any, options?: JsonOptions): Observable<T> {
    options = this.getJsonOptions(options);
    const intercepted = this.getOptionsForController(controller, url, options);
    this.requestsNotificationEmitter.emit(`PUT ${intercepted.url}`);

    return this.handleResponse<T>(
      controller,
      this.http.put<T>(intercepted.url, body, intercepted.options),
      'PUT', url, body, options
    );
  }

  delete<T>(controller: Controller, url: string, options?: JsonOptions): Observable<T> {
    options = this.getJsonOptions(options);
    const intercepted = this.getOptionsForController(controller, url, options);
    this.requestsNotificationEmitter.emit(`DELETE ${intercepted.url}`);

    return this.handleResponse<T>(
      controller,
      this.http.delete<T>(intercepted.url, intercepted.options),
      'DELETE', url, null, options
    );
  }

  patch<T>(controller: Controller, url: string, body: any, options?: JsonOptions): Observable<T> {
    options = this.getJsonOptions(options);
    const intercepted = this.getOptionsForController(controller, url, options);
    return this.handleResponse<T>(
      controller,
      this.http.patch<T>(intercepted.url, body, intercepted.options),
      'PATCH', url, body, options
    );
  }

  head<T>(controller: Controller, url: string, options?: JsonOptions): Observable<T> {
    options = this.getJsonOptions(options);
    const intercepted = this.getOptionsForController(controller, url, options);
    return this.handleResponse<T>(
      controller,
      this.http.head<T>(intercepted.url, intercepted.options),
      'HEAD', url, null, options
    );
  }

  options<T>(controller: Controller, url: string, options?: JsonOptions): Observable<T> {
    options = this.getJsonOptions(options);
    const intercepted = this.getOptionsForController(controller, url, options);
    return this.handleResponse<T>(
      controller,
      this.http.options<T>(intercepted.url, intercepted.options),
      'OPTIONS', url, null, options
    );
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

  /**
   * Wrap an HTTP observable with 401 intercept logic for silent token refresh.
   */
  private handleResponse<T>(
    controller: Controller,
    source$: Observable<T>,
    method: string,
    url: string,
    body: any | null,
    options: any,
  ): Observable<T> {
    return source$.pipe(
      catchError((error: HttpErrorResponse) => {
        // Only intercept 401; skip auth endpoints to avoid loops
        if (error.status !== 401) {
          return this.errorHandler.handleError(error, url);
        }
        if (
          url.endsWith('/access/users/login') ||
          url.endsWith('/access/users/authenticate') ||
          url.endsWith('/access/users/refresh')
        ) {
          return this.errorHandler.handleError(error, url);
        }

        const refreshToken = localStorage.getItem(`refresh_token_${controller.id}`);
        if (!refreshToken) {
          this.redirectToLogin(controller);
          return throwError(() => error);
        }

        return this.retryAfterRefresh<T>(controller, method, url, body, options, refreshToken);
      }),
    );
  }

  /**
   * Attempt to refresh the access token and retry the original request.
   */
  private retryAfterRefresh<T>(
    controller: Controller,
    method: string,
    url: string,
    body: any | null,
    options: any,
    refreshToken: string,
  ): Observable<T> {
    // Another refresh is already in-flight — queue this request
    if (this.isRefreshing) {
      return new Observable<T>((subscriber) => {
        this.failedQueue.push({
          resolve: () => {
            this.executeRequest<T>(controller, method, url, body, options).subscribe({
              next: (v) => {
                subscriber.next(v);
                subscriber.complete();
              },
              error: (e) => subscriber.error(e),
            });
          },
          reject: (err) => subscriber.error(err),
        });
      });
    }

    // Start the refresh
    this.isRefreshing = true;
    return this.doRefreshToken(controller, refreshToken).pipe(
      switchMap((response) => {
        // Update tokens
        controller.authToken = response.access_token;
        localStorage.setItem(`controller-${controller.id}`, JSON.stringify(controller));
        if (response.refresh_token) {
          localStorage.setItem(`refresh_token_${controller.id}`, response.refresh_token);
        }

        // Drain the queue of requests that arrived while we were refreshing
        this.isRefreshing = false;
        this.processQueue(null);

        // Retry the original request
        return this.executeRequest<T>(controller, method, url, body, options);
      }),
      catchError((refreshError) => {
        this.isRefreshing = false;
        this.processQueue(refreshError);
        // Only clear tokens and redirect on 401; preserve tokens for other errors
        // (e.g. network failure, server error) so the user can retry
        if (refreshError.status === 401) {
          this.redirectToLogin(controller);
        }
        return throwError(() => refreshError);
      }),
    );
  }

  /**
   * Call the refresh endpoint to obtain a new access token.
   */
  private doRefreshToken(controller: Controller, refreshToken: string): Observable<AuthResponse> {
    const url = `${controller.protocol}//${controller.host}:${controller.port}/${environment.current_version}/access/users/refresh`;
    return this.http.post<AuthResponse>(url, { refresh_token: refreshToken }, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
    });
  }

  /**
   * Re-execute a request with the current controller state (rebuilds URL + auth headers).
   */
  private executeRequest<T>(
    controller: Controller,
    method: string,
    url: string,
    body: any | null,
    options: any,
  ): Observable<T> {
    const intercepted = this.getOptionsForController(controller, url, options);
    this.requestsNotificationEmitter.emit(`${method} ${intercepted.url}`);
    return this.http.request<T>(method, intercepted.url, {
      body: body,
      headers: intercepted.options.headers,
      params: intercepted.options.params,
      // Carry progress reporting through a 401 refresh retry so retried
      // uploads keep emitting UploadProgress events.
      reportProgress: intercepted.options.reportProgress === true,
      responseType: intercepted.options.responseType || ('json' as const),
    }) as Observable<T>;
  }

  private processQueue(error: unknown): void {
    if (error) {
      this.failedQueue.forEach((p) => p.reject(error));
    } else {
      this.failedQueue.forEach((p) => p.resolve());
    }
    this.failedQueue = [];
  }

  private clearTokens(controller: Controller): void {
    localStorage.removeItem(`refresh_token_${controller.id}`);
    controller.authToken = null;
    localStorage.setItem(`controller-${controller.id}`, JSON.stringify(controller));
  }

  private redirectToLogin(controller: Controller): void {
    // An in-app Router navigation does not reset singletons the way a full-page
    // reload would, so explicitly tear down the refresh-token flow state and
    // persisted auth first. Otherwise LoginComponent sees the stale authToken
    // and navigates back to projects, causing a login loop.
    this.clearTokens(controller);
    controller.tokenExpired = true;
    localStorage.setItem(`controller-${controller.id}`, JSON.stringify(controller));
    this.isRefreshing = false;
    this.processQueue(new Error('Session expired, redirecting to login'));
    this.router.navigate(['/controller', controller.id, 'login']);
  }
}

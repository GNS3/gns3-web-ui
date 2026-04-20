import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { HttpController, ControllerError, ControllerErrorHandler, JsonOptions } from './http-controller.service';
import { Controller, ControllerProtocol } from '@models/controller';
import { environment } from '../../environments/environment';
import { of, throwError } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';

describe('HttpController', () => {
  let service: HttpController;
  let mockHttp: HttpClient;
  let mockErrorHandler: ControllerErrorHandler;
  let mockController: Controller;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()],
    });

    mockHttp = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      patch: vi.fn(),
      head: vi.fn(),
      options: vi.fn(),
    } as any as HttpClient;

    mockErrorHandler = {
      handleError: vi.fn((err: any) => throwError(() => err)),
    } as any as ControllerErrorHandler;

    service = new HttpController(mockHttp, mockErrorHandler);

    mockController = {
      id: 1,
      name: 'Test Controller',
      host: 'localhost',
      port: 3080,
      protocol: 'http:' as ControllerProtocol,
      authToken: 'test-token',
      tokenExpired: false,
    } as Controller;
  });

  describe('Service Creation', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should be instance of HttpController', () => {
      expect(service).toBeInstanceOf(HttpController);
    });

    it('should have requestsNotificationEmitter', () => {
      expect(service.requestsNotificationEmitter).toBeDefined();
    });

    it('should emit events on requests', () => {
      let emittedValue: string | undefined;
      service.requestsNotificationEmitter.subscribe((value) => {
        emittedValue = value;
      });

      (mockHttp.get as any).mockReturnValue(of({}));
      service.get(mockController, '/test');

      expect(emittedValue).toBe('GET http://localhost:3080/' + environment.current_version + '/test');
    });
  });

  describe('get', () => {
    it('should make GET request with correct URL', () => {
      const mockResponse = { data: 'test' };
      (mockHttp.get as any).mockReturnValue(of(mockResponse));

      service.get(mockController, '/version').subscribe();

      expect(mockHttp.get).toHaveBeenCalledWith(
        'http://localhost:3080/' + environment.current_version + '/version',
        expect.objectContaining({ responseType: 'json' })
      );
    });

    it('should include auth token in headers', () => {
      (mockHttp.get as any).mockReturnValue(of({}));

      service.get(mockController, '/test').subscribe();

      expect(mockHttp.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
        })
      );
    });

    it('should use default responseType json when no options provided', () => {
      (mockHttp.get as any).mockReturnValue(of({}));

      service.get(mockController, '/test').subscribe();

      expect(mockHttp.get).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ responseType: 'json' }));
    });

    it('should preserve custom options', () => {
      const customOptions: JsonOptions = {
        observe: 'body',
        params: { key: 'value' },
      };
      (mockHttp.get as any).mockReturnValue(of({}));

      service.get(mockController, '/test', customOptions);

      expect(mockHttp.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          observe: 'body',
          params: { key: 'value' },
        })
      );
    });

    it('should handle controller without host', () => {
      const localController = {} as Controller;
      (mockHttp.get as any).mockReturnValue(of({}));

      service.get(localController, '/test').subscribe();

      expect(mockHttp.get).toHaveBeenCalledWith('/' + environment.current_version + '/test', expect.any(Object));
    });

    it('should apply error handling', () => {
      const error = new HttpErrorResponse({ status: 404, statusText: 'Not Found' });
      (mockHttp.get as any).mockReturnValue(throwError(() => error));
      (mockErrorHandler.handleError as any).mockReturnValue(throwError(() => error));

      service.get(mockController, '/test').subscribe({
        error: (err) => expect(err).toBeDefined(),
      });
    });
  });

  describe('getText', () => {
    it('should make GET request with text responseType', () => {
      (mockHttp.get as any).mockReturnValue(of('text response'));

      service.getText(mockController, '/test').subscribe();

      expect(mockHttp.get).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ responseType: 'text' }));
    });
  });

  describe('getBlob', () => {
    it('should make GET request with blob responseType', () => {
      const mockBlob = new Blob();
      (mockHttp.get as any).mockReturnValue(of(mockBlob));

      service.getBlob(mockController, '/test').subscribe();

      expect(mockHttp.get).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ responseType: 'blob' }));
    });
  });

  describe('post', () => {
    it('should make POST request with correct URL', () => {
      const body = { name: 'test' };
      const mockResponse = { id: 1, ...body };
      (mockHttp.post as any).mockReturnValue(of(mockResponse));

      service.post(mockController, '/test', body).subscribe();

      expect(mockHttp.post).toHaveBeenCalledWith(
        'http://localhost:3080/' + environment.current_version + '/test',
        body,
        expect.any(Object)
      );
    });

    it('should emit POST event', () => {
      let emittedValue: string | undefined;
      service.requestsNotificationEmitter.subscribe((value) => {
        emittedValue = value;
      });

      (mockHttp.post as any).mockReturnValue(of({}));
      service.post(mockController, '/test', {});

      expect(emittedValue).toBe('POST http://localhost:3080/' + environment.current_version + '/test');
    });

    it('should include auth token', () => {
      (mockHttp.post as any).mockReturnValue(of({}));

      service.post(mockController, '/test', {}).subscribe();

      expect(mockHttp.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
        })
      );
    });
  });

  describe('postBlob', () => {
    it('should make POST request with blob responseType', () => {
      const mockBlob = new Blob(['test'], { type: 'application/octet-stream' });
      (mockHttp.post as any).mockReturnValue(of(mockBlob));

      service.postBlob(mockController, '/test', mockBlob).subscribe();

      expect(mockHttp.post).toHaveBeenCalledWith(
        expect.any(String),
        mockBlob,
        expect.objectContaining({ responseType: 'blob' })
      );
    });
  });

  describe('put', () => {
    it('should make PUT request with correct URL', () => {
      const body = { name: 'updated' };
      (mockHttp.put as any).mockReturnValue(of(body));

      service.put(mockController, '/test/1', body).subscribe();

      expect(mockHttp.put).toHaveBeenCalledWith(
        'http://localhost:3080/' + environment.current_version + '/test/1',
        body,
        expect.any(Object)
      );
    });

    it('should emit PUT event', () => {
      let emittedValue: string | undefined;
      service.requestsNotificationEmitter.subscribe((value) => {
        emittedValue = value;
      });

      (mockHttp.put as any).mockReturnValue(of({}));
      service.put(mockController, '/test', {});

      expect(emittedValue).toBe('PUT http://localhost:3080/' + environment.current_version + '/test');
    });
  });

  describe('delete', () => {
    it('should make DELETE request with correct URL', () => {
      (mockHttp.delete as any).mockReturnValue(of(null));

      service.delete(mockController, '/test/1').subscribe();

      expect(mockHttp.delete).toHaveBeenCalledWith(
        'http://localhost:3080/' + environment.current_version + '/test/1',
        expect.any(Object)
      );
    });

    it('should emit DELETE event', () => {
      let emittedValue: string | undefined;
      service.requestsNotificationEmitter.subscribe((value) => {
        emittedValue = value;
      });

      (mockHttp.delete as any).mockReturnValue(of({}));
      service.delete(mockController, '/test');

      expect(emittedValue).toBe('DELETE http://localhost:3080/' + environment.current_version + '/test');
    });
  });

  describe('patch', () => {
    it('should make PATCH request with correct URL', () => {
      const body = { name: 'patched' };
      (mockHttp.patch as any).mockReturnValue(of(body));

      service.patch(mockController, '/test/1', body).subscribe();

      expect(mockHttp.patch).toHaveBeenCalledWith(
        'http://localhost:3080/' + environment.current_version + '/test/1',
        body,
        expect.any(Object)
      );
    });

    it('should not emit event for patch', () => {
      let emittedValue: string | undefined;
      service.requestsNotificationEmitter.subscribe((value) => {
        emittedValue = value;
      });

      (mockHttp.patch as any).mockReturnValue(of({}));
      service.patch(mockController, '/test', {});

      expect(emittedValue).toBeUndefined();
    });
  });

  describe('head', () => {
    it('should make HEAD request with correct URL', () => {
      (mockHttp.head as any).mockReturnValue(of(null));

      service.head(mockController, '/test').subscribe();

      expect(mockHttp.head).toHaveBeenCalledWith(
        'http://localhost:3080/' + environment.current_version + '/test',
        expect.any(Object)
      );
    });
  });

  describe('options', () => {
    it('should make OPTIONS request with correct URL', () => {
      (mockHttp.options as any).mockReturnValue(of(null));

      service.options(mockController, '/test').subscribe();

      expect(mockHttp.options).toHaveBeenCalledWith(
        'http://localhost:3080/' + environment.current_version + '/test',
        expect.any(Object)
      );
    });
  });

  describe('URL Construction', () => {
    it('should construct URL with protocol, host, port and version', () => {
      (mockHttp.get as any).mockReturnValue(of({}));

      service.get(mockController, '/version');

      expect(mockHttp.get).toHaveBeenCalledWith(
        'http://localhost:3080/' + environment.current_version + '/version',
        expect.any(Object)
      );
    });

    it('should handle https protocol', () => {
      const httpsController = {
        ...mockController,
        protocol: 'https:' as ControllerProtocol,
      };
      (mockHttp.get as any).mockReturnValue(of({}));

      service.get(httpsController, '/test');

      expect(mockHttp.get).toHaveBeenCalledWith(
        'https://localhost:3080/' + environment.current_version + '/test',
        expect.any(Object)
      );
    });

    it('should use location.protocol when controller has no protocol', () => {
      const controllerWithoutProtocol = {
        host: 'localhost',
        port: 3080,
      } as Controller;
      (mockHttp.get as any).mockReturnValue(of({}));

      service.get(controllerWithoutProtocol, '/test');

      expect(mockHttp.get).toHaveBeenCalled();
    });

    it('should use environment.current_version in URL', () => {
      (mockHttp.get as any).mockReturnValue(of({}));

      service.get(mockController, '/api/test');

      expect(mockHttp.get).toHaveBeenCalledWith(
        'http://localhost:3080/' + environment.current_version + '/api/test',
        expect.any(Object)
      );
    });

    it('should handle local controller without host', () => {
      const localController = {} as Controller;
      (mockHttp.get as any).mockReturnValue(of({}));

      service.get(localController, '/version');

      expect(mockHttp.get).toHaveBeenCalledWith('/' + environment.current_version + '/version', expect.any(Object));
    });
  });

  describe('Authentication', () => {
    it('should add Authorization header with Bearer token', () => {
      (mockHttp.get as any).mockReturnValue(of({}));

      service.get(mockController, '/test');

      expect(mockHttp.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
        })
      );
    });

    it('should not add Authorization header when token is expired', () => {
      const expiredController = {
        ...mockController,
        tokenExpired: true,
      };
      (mockHttp.get as any).mockReturnValue(of({}));

      service.get(expiredController, '/test');

      expect(mockHttp.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.not.objectContaining({ Authorization: expect.anything() }),
        })
      );
    });

    it('should not add Authorization header when no token', () => {
      const noTokenController = {
        host: 'localhost',
        port: 3080,
      } as Controller;
      (mockHttp.get as any).mockReturnValue(of({}));

      service.get(noTokenController, '/test');

      expect(mockHttp.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.any(Object),
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should apply error handler to all requests', () => {
      const errorResponse = new HttpErrorResponse({ status: 500, statusText: 'Server Error' });
      (mockHttp.get as any).mockReturnValue(throwError(() => errorResponse));
      (mockErrorHandler.handleError as any).mockReturnValue(throwError(() => errorResponse));

      let errorCaught: any;
      service.get(mockController, '/test').subscribe({
        error: (err) => {
          errorCaught = err;
        },
      });

      expect(mockErrorHandler.handleError).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle controller with missing id', () => {
      const controllerWithoutId = {
        host: 'localhost',
        port: 3080,
      } as Controller;
      (mockHttp.get as any).mockReturnValue(of({}));

      expect(() => service.get(controllerWithoutId, '/test')).not.toThrow();
    });

    it('should handle empty URL', () => {
      (mockHttp.get as any).mockReturnValue(of({}));

      service.get(mockController, '').subscribe();

      expect(mockHttp.get).toHaveBeenCalled();
    });

    it('should handle URL with leading slash', () => {
      (mockHttp.get as any).mockReturnValue(of({}));

      service.get(mockController, '//test');

      expect(mockHttp.get).toHaveBeenCalled();
    });

    it('should handle null body in post', () => {
      (mockHttp.post as any).mockReturnValue(of(null));

      service.post(mockController, '/test', null).subscribe();

      expect(mockHttp.post).toHaveBeenCalled();
    });

    it('should handle undefined body in post', () => {
      (mockHttp.post as any).mockReturnValue(of(undefined));

      service.post(mockController, '/test', undefined).subscribe();

      expect(mockHttp.post).toHaveBeenCalled();
    });
  });
});

describe('ControllerError', () => {
  it('should create error with message', () => {
    const error = new ControllerError('Test error');
    expect(error.message).toBe('Test error');
  });

  it('should be instance of Error', () => {
    const error = new ControllerError('Test error');
    expect(error).toBeInstanceOf(Error);
  });

  it('should have originalError property', () => {
    const originalError = new Error('Original');
    const controllerError = ControllerError.fromError('Controller error', originalError);

    expect(controllerError.originalError).toBe(originalError);
  });

  it('should create error from existing error', () => {
    const originalError = new Error('Network failure');
    const controllerError = ControllerError.fromError('Controller is unreachable', originalError);

    expect(controllerError.message).toBe('Controller is unreachable');
    expect(controllerError.originalError).toBe(originalError);
  });
});

describe('ControllerErrorHandler', () => {
  let handler: ControllerErrorHandler;

  beforeEach(() => {
    handler = new ControllerErrorHandler();
  });

  it('should be instance of ControllerErrorHandler', () => {
    expect(handler).toBeInstanceOf(ControllerErrorHandler);
  });

  it('should handle HttpErrorResponse with status 0', () => {
    const error = new HttpErrorResponse({
      status: 0,
      statusText: 'Unknown Error',
      error: new Error('Network error'),
    });

    let result: any;
    handler.handleError(error).subscribe({
      error: (err) => {
        result = err;
      },
    });

    expect(result).toBeInstanceOf(ControllerError);
    expect(result.message).toBe('Controller is unreachable');
  });

  it('should pass through normal errors', () => {
    const error = new HttpErrorResponse({
      status: 404,
      statusText: 'Not Found',
    });

    let result: any;
    handler.handleError(error).subscribe({
      error: (err) => {
        result = err;
      },
    });

    expect(result).toBe(error);
  });

  it('should handle error with status 401', () => {
    const error = new HttpErrorResponse({
      status: 401,
      statusText: 'Unauthorized',
    });

    let result: any;
    handler.handleError(error).subscribe({
      error: (err) => {
        result = err;
      },
    });

    expect(result.status).toBe(401);
  });

  it('should handle error with status 500', () => {
    const error = new HttpErrorResponse({
      status: 500,
      statusText: 'Internal Server Error',
    });

    let result: any;
    handler.handleError(error).subscribe({
      error: (err) => {
        result = err;
      },
    });

    expect(result.status).toBe(500);
  });
});

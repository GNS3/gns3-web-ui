import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from 'environments/environment';
import { Server } from '../models/server';
import { AppTestingModule } from '../testing/app-testing/app-testing.module';
import { HttpServer, ServerError, ServerErrorHandler } from './http-server.service';
import { getTestServer } from './testing';

class MyType {
  id: number;
}

describe('ServerError', () => {
  it('should construct with message', () => {
    const error = new Error('test');
    expect(error.message).toEqual('test');
  });

  it('should construct ServerError from error', () => {
    const error = new Error('test');
    const serverError = ServerError.fromError('new message', error);
    expect(serverError.originalError).toEqual(error);
    expect(serverError.message).toEqual('new message');
  });
});

describe('ServerErrorHandler', () => {
  it('should handle HttpErrorResponse with status 0', (done) => {
    const error = new HttpErrorResponse({ status: 0 });

    const handler = new ServerErrorHandler();
    const result = handler.handleError(error);

    result.subscribe(null, (err) => {
      expect(err.message).toEqual('Server is unreachable');
      done();
    });
  });

  it('should not handle HttpErrorResponse with status!=0', (done) => {
    const error = new HttpErrorResponse({ status: 499 });

    const handler = new ServerErrorHandler();
    const result = handler.handleError(error);

    result.subscribe(null, (err) => {
      expect(err.message).toEqual('Http failure response for (unknown url): 499 undefined');
      done();
    });
  });
});

describe('HttpServer', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;
  let service: HttpServer;
  let server: Server;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, AppTestingModule],
      providers: [HttpServer],
    });

    httpClient = TestBed.get(HttpClient);
    httpTestingController = TestBed.get(HttpTestingController);
    service = TestBed.get(HttpServer);

    server = getTestServer();
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should make GET query for get method', () => {
    service.get(server, '/test').subscribe();

    const req = httpTestingController.expectOne(`http://127.0.0.1:3080/${environment.current_version}/test`);
    expect(req.request.method).toEqual('GET');
    expect(req.request.responseType).toEqual('json');
  });

  it('should make GET query for get method and return instance of type', () => {
    const testData: MyType = { id: 3 };

    service.get<MyType>(server, '/test').subscribe((data) => {
      expect(data instanceof MyType).toBeFalsy();
      expect(data).toEqual(testData);
    });

    const req = httpTestingController.expectOne(`http://127.0.0.1:3080/${environment.current_version}/test`);
    expect(req.request.method).toEqual('GET');
    expect(req.request.responseType).toEqual('json');

    req.flush({ id: 3 });
  });

  it('HttpClient should make GET query for get method and return instance of type', () => {
    const testData: MyType = { id: 3 };

    httpClient.get<MyType>('http://localhost/test').subscribe((data) => {
      // when this condition is true, it would be great
      expect(data instanceof MyType).toBeFalsy();
      expect(data).toEqual(testData);
    });

    const req = httpTestingController.expectOne('http://localhost/test');
    expect(req.request.method).toEqual('GET');
    expect(req.request.responseType).toEqual('json');

    req.flush(testData);
  });

  it('should make GET query for getText method', () => {
    service.getText(server, '/test').subscribe();

    const req = httpTestingController.expectOne(`http://127.0.0.1:3080/${environment.current_version}/test`);
    expect(req.request.method).toEqual('GET');
    expect(req.request.responseType).toEqual('text');
  });

  it('should make GET query for getText method and preserve options', () => {
    service
      .getText(server, '/test', {
        headers: {
          CustomHeader: 'value',
        },
        responseType: 'text',
      })
      .subscribe();

    const req = httpTestingController.expectOne(`http://127.0.0.1:3080/${environment.current_version}/test`);
    expect(req.request.method).toEqual('GET');
    expect(req.request.responseType).toEqual('text');
  });

  it('should make POST query for post method', () => {
    service.post(server, '/test', { test: '1' }).subscribe();

    const req = httpTestingController.expectOne(`http://127.0.0.1:3080/${environment.current_version}/test`);
    expect(req.request.method).toEqual('POST');
    expect(req.request.responseType).toEqual('json');
  });

  it('should make PUT query for put method', () => {
    service.put(server, '/test', { test: '1' }).subscribe();

    const req = httpTestingController.expectOne(`http://127.0.0.1:3080/${environment.current_version}/test`);
    expect(req.request.method).toEqual('PUT');
    expect(req.request.responseType).toEqual('json');
  });

  it('should make DELETE query for delete method', () => {
    service.delete(server, '/test').subscribe();

    const req = httpTestingController.expectOne(`http://127.0.0.1:3080/${environment.current_version}/test`);
    expect(req.request.method).toEqual('DELETE');
    expect(req.request.responseType).toEqual('json');
  });

  it('should make PATCH query for patch method', () => {
    service.patch(server, '/test', { test: '1' }).subscribe();

    const req = httpTestingController.expectOne(`http://127.0.0.1:3080/${environment.current_version}/test`);
    expect(req.request.method).toEqual('PATCH');
    expect(req.request.responseType).toEqual('json');
  });

  it('should make HEAD query for head method', () => {
    service.head(server, '/test').subscribe();

    const req = httpTestingController.expectOne(`http://127.0.0.1:3080/${environment.current_version}/test`);
    expect(req.request.method).toEqual('HEAD');
    expect(req.request.responseType).toEqual('json');
  });

  it('should make OPTIONS query for options method', () => {
    service.options(server, '/test').subscribe();

    const req = httpTestingController.expectOne(`http://127.0.0.1:3080/${environment.current_version}/test`);
    expect(req.request.method).toEqual('OPTIONS');
    expect(req.request.responseType).toEqual('json');
  });

  it('should make local call when ip and port is not defined', () => {
    server.host = null;
    server.port = null;

    service
      .get(server, '/test', {
        headers: {
          CustomHeader: 'value',
        },
      })
      .subscribe();

    const req = httpTestingController.expectOne(`/${environment.current_version}/test`);
    expect(req.request.url).toBe(`/${environment.current_version}/test`);
  });
});

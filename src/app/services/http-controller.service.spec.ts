import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from 'environments/environment';
import { Controller } from '@models/controller';
import { AppTestingModule } from '../testing/app-testing/app-testing.module';
import { HttpController, ControllerError, ControllerErrorHandler } from './http-controller.service';
import { getTestController } from './testing';

class MyType {
  id: number;
}

describe('ControllerError', () => {
  it('should construct with message', () => {
    const error = new Error('test');
    expect(error.message).toEqual('test');
  });

  it('should construct ControllerError from error', () => {
    const error = new Error('test');
    const controllerError = ControllerError.fromError('new message', error);
    expect(controllerError.originalError).toEqual(error);
    expect(controllerError.message).toEqual('new message');
  });
});

describe('ControllerErrorHandler', () => {
  it('should handle HttpErrorResponse with status 0', (done) => {
    const error = new HttpErrorResponse({ status: 0 });

    const handler = new ControllerErrorHandler();
    const result = handler.handleError(error);

    result.subscribe(null, (err) => {
      expect(err.message).toEqual('Controller is unreachable');
      done();
    });
  });

  it('should not handle HttpErrorResponse with status!=0', (done) => {
    const error = new HttpErrorResponse({ status: 499 });

    const handler = new ControllerErrorHandler();
    const result = handler.handleError(error);

    result.subscribe(null, (err) => {
      expect(err.message).toEqual('Http failure response for (unknown url): 499 undefined');
      done();
    });
  });
});

describe('HttpController', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;
  let service: HttpController;
  let controller: Controller;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, AppTestingModule],
      providers: [HttpController],
    });

    httpClient = TestBed.get(HttpClient);
    httpTestingController = TestBed.get(HttpTestingController);
    service = TestBed.get(HttpController);

    controller = getTestController();
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should make GET query for get method', () => {
    service.get(controller, '/test').subscribe();

    const req = httpTestingController.expectOne(`http://127.0.0.1:3080/${environment.current_version}/test`);
    expect(req.request.method).toEqual('GET');
    expect(req.request.responseType).toEqual('json');
  });

  it('should make GET query for get method and return instance of type', () => {
    const testData: MyType = { id: 3 };

    service.get<MyType>(controller, '/test').subscribe((data) => {
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
    service.getText(controller, '/test').subscribe();

    const req = httpTestingController.expectOne(`http://127.0.0.1:3080/${environment.current_version}/test`);
    expect(req.request.method).toEqual('GET');
    expect(req.request.responseType).toEqual('text');
  });

  it('should make GET query for getText method and preserve options', () => {
    service
      .getText(controller, '/test', {
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
    service.post(controller, '/test', { test: '1' }).subscribe();

    const req = httpTestingController.expectOne(`http://127.0.0.1:3080/${environment.current_version}/test`);
    expect(req.request.method).toEqual('POST');
    expect(req.request.responseType).toEqual('json');
  });

  it('should make PUT query for put method', () => {
    service.put(controller, '/test', { test: '1' }).subscribe();

    const req = httpTestingController.expectOne(`http://127.0.0.1:3080/${environment.current_version}/test`);
    expect(req.request.method).toEqual('PUT');
    expect(req.request.responseType).toEqual('json');
  });

  it('should make DELETE query for delete method', () => {
    service.delete(controller, '/test').subscribe();

    const req = httpTestingController.expectOne(`http://127.0.0.1:3080/${environment.current_version}/test`);
    expect(req.request.method).toEqual('DELETE');
    expect(req.request.responseType).toEqual('json');
  });

  it('should make PATCH query for patch method', () => {
    service.patch(controller, '/test', { test: '1' }).subscribe();

    const req = httpTestingController.expectOne(`http://127.0.0.1:3080/${environment.current_version}/test`);
    expect(req.request.method).toEqual('PATCH');
    expect(req.request.responseType).toEqual('json');
  });

  it('should make HEAD query for head method', () => {
    service.head(controller, '/test').subscribe();

    const req = httpTestingController.expectOne(`http://127.0.0.1:3080/${environment.current_version}/test`);
    expect(req.request.method).toEqual('HEAD');
    expect(req.request.responseType).toEqual('json');
  });

  it('should make OPTIONS query for options method', () => {
    service.options(controller, '/test').subscribe();

    const req = httpTestingController.expectOne(`http://127.0.0.1:3080/${environment.current_version}/test`);
    expect(req.request.method).toEqual('OPTIONS');
    expect(req.request.responseType).toEqual('json');
  });

  it('should make local call when ip and port is not defined', () => {
    controller.host = null;
    controller.port = null;

    service
      .get(controller, '/test', {
        headers: {
          CustomHeader: 'value',
        },
      })
      .subscribe();

    const req = httpTestingController.expectOne(`/${environment.current_version}/test`);
    expect(req.request.url).toBe(`/${environment.current_version}/test`);
  });
});

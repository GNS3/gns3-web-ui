import { TestBed,  } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpClient } from "@angular/common/http";

import { Server } from '../models/server';
import { HttpServer } from './http-server.service';


describe('HttpServer', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;
  let service: HttpServer;
  let server: Server;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      providers: [
        HttpServer
      ]
    });

    httpClient = TestBed.get(HttpClient);
    httpTestingController = TestBed.get(HttpTestingController);
    service = TestBed.get(HttpServer);

    server = new Server();
    server.ip = "127.0.0.1";
    server.port = 3080;
    server.authorization = "none";
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should make GET query for get method', () => {
    service.get(server, '/test').subscribe();

    const req = httpTestingController.expectOne('http://127.0.0.1:3080/v2/test');
    expect(req.request.method).toEqual("GET");
    expect(req.request.responseType).toEqual("json");
  });

  it('should make GET query for getText method', () => {
    service.getText(server, '/test').subscribe();

    const req = httpTestingController.expectOne('http://127.0.0.1:3080/v2/test');
    expect(req.request.method).toEqual("GET");
    expect(req.request.responseType).toEqual("text");
  });

  it('should make GET query for getText method and preserve options', () => {
    service.getText(server, '/test', {
      headers: {
        'CustomHeader': 'value'
      },
      responseType: 'text'
    }).subscribe();

    const req = httpTestingController.expectOne('http://127.0.0.1:3080/v2/test');
    expect(req.request.method).toEqual("GET");
    expect(req.request.responseType).toEqual("text");
  });

  it('should make POST query for post method', () => {
    service.post(server, '/test', {test: "1"}).subscribe();

    const req = httpTestingController.expectOne('http://127.0.0.1:3080/v2/test');
    expect(req.request.method).toEqual("POST");
    expect(req.request.responseType).toEqual("json");
  });

  it('should make PUT query for put method', () => {
    service.put(server, '/test', {test: "1"}).subscribe();

    const req = httpTestingController.expectOne('http://127.0.0.1:3080/v2/test');
    expect(req.request.method).toEqual("PUT");
    expect(req.request.responseType).toEqual("json");
  });

  it('should make DELETE query for delete method', () => {
    service.delete(server, '/test').subscribe();

    const req = httpTestingController.expectOne('http://127.0.0.1:3080/v2/test');
    expect(req.request.method).toEqual("DELETE");
    expect(req.request.responseType).toEqual("json");
  });

  it('should make PATCH query for patch method', () => {
    service.patch(server, '/test', {test: "1"}).subscribe();

    const req = httpTestingController.expectOne('http://127.0.0.1:3080/v2/test');
    expect(req.request.method).toEqual("PATCH");
    expect(req.request.responseType).toEqual("json");
  });

  it('should make HEAD query for head method', () => {
    service.head(server, '/test').subscribe();

    const req = httpTestingController.expectOne('http://127.0.0.1:3080/v2/test');
    expect(req.request.method).toEqual("HEAD");
    expect(req.request.responseType).toEqual("json");
  });

  it('should make OPTIONS query for options method', () => {
    service.options(server, '/test').subscribe();

    const req = httpTestingController.expectOne('http://127.0.0.1:3080/v2/test');
    expect(req.request.method).toEqual("OPTIONS");
    expect(req.request.responseType).toEqual("json");
  });

  it('should add headers for `basic` authorization', () => {
    server.authorization = "basic";
    server.login = "login";
    server.password = "password";

    service.get(server, '/test').subscribe();

    const req = httpTestingController.expectOne('http://127.0.0.1:3080/v2/test');
    expect(req.request.method).toEqual("GET");
    expect(req.request.responseType).toEqual("json");
    expect(req.request.headers.get('Authorization')).toEqual('Basic bG9naW46cGFzc3dvcmQ=');
  });

  it('should add headers for `basic` authorization and preserve headers', () => {
    server.authorization = "basic";
    server.login = "login";
    server.password = "password";

    service.get(server, '/test', {
      headers: {
        'CustomHeader': 'value'
      }
    }).subscribe();

    const req = httpTestingController.expectOne('http://127.0.0.1:3080/v2/test');
    expect(req.request.method).toEqual("GET");
    expect(req.request.responseType).toEqual("json");
    expect(req.request.headers.get('Authorization')).toEqual('Basic bG9naW46cGFzc3dvcmQ=');
    expect(req.request.headers.get('CustomHeader')).toEqual('value');
  });
});

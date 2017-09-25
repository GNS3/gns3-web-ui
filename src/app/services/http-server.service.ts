import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import {Headers, Http, RequestOptions, RequestOptionsArgs, Response} from "@angular/http";
import {Server} from "../models/server";

@Injectable()
export class HttpServer {

  constructor(private http: Http) { }

  get(server: Server, url: string, options?: RequestOptionsArgs): Observable<Response> {
    options = this.getOptionsForServer(server, url, options);
    return this.http.get(url, options);
  }

  post(server: Server, url: string, body: any, options?: RequestOptionsArgs): Observable<Response> {
    options = this.getOptionsForServer(server, url, options);
    return this.http.post(url, body, options);
  }

  put(server: Server, url: string, body: any, options?: RequestOptionsArgs): Observable<Response> {
    options = this.getOptionsForServer(server, url, options);
    return this.http.put(url, body, options);
  }

  delete(server: Server, url: string, options?: RequestOptionsArgs): Observable<Response> {
    options = this.getOptionsForServer(server, url, options);
    return this.http.delete(url, options);
  }

  patch(server: Server, url: string, body: any, options?: RequestOptionsArgs): Observable<Response> {
    options = this.getOptionsForServer(server, url, options);
    return this.http.patch(url, body, options);
  }

  head(server: Server, url: string, options?: RequestOptionsArgs): Observable<Response> {
    options = this.getOptionsForServer(server, url, options);
    return this.http.patch(url, options);
  }

  options(server: Server, url: string, options?: RequestOptionsArgs): Observable<Response> {
    options = this.getOptionsForServer(server, url, options);
    return this.http.options(url, options);
  }

  private getOptionsForServer(server: Server, url: string, options) {
    if (options === undefined) {
      options = new RequestOptions();
    }
    options.url = `http://${server.ip}:${server.port}/v2${url}`;

    if (options.headers === null) {
      options.headers = new Headers();
    }

    if (server.authorization === "basic") {
      const credentials = btoa(`${server.login}:${server.password}`);
      options.headers.append('Authorization', `Basic ${credentials}`);
    }

    return options;
  }

}

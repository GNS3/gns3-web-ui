import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { inject, TestBed } from '@angular/core/testing';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';
import { Controller } from '@models/controller';
import { AppTestingModule } from '../testing/app-testing/app-testing.module';
import { HttpController } from './http-controller.service';
import { getTestController } from './testing';
import { VersionService } from './version.service';

export class MockedVersionService {
  public response: Observable<any>;

  public get(controller: Controller) {
    return this.response;
  }
}

describe('VersionService', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;
  let httpController: HttpController;
  let service: VersionService;
  let controller: Controller;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, AppTestingModule],
      providers: [provideZonelessChangeDetection(), HttpController, VersionService],
    });

    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
    httpController = TestBed.inject(HttpController);
    service = TestBed.inject(VersionService);
    controller = getTestController();
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', inject([VersionService], (service: VersionService) => {
    expect(service).toBeTruthy();
  }));

  it('should get version', inject([VersionService], (service: VersionService) => {
    service.get(controller).subscribe();

    const req = httpTestingController.expectOne(`http://127.0.0.1:3080/${environment.current_version}/version`);
    expect(req.request.method).toEqual('GET');
  }));
});

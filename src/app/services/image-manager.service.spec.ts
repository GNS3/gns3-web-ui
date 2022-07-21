import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { inject, TestBed } from '@angular/core/testing';
import { AppTestingModule } from 'app/testing/app-testing/app-testing.module';
import{ Controller } from '../models/controller';
import { HttpController } from './http-controller.service';
import { getTestServer } from './testing';

import { ImageManagerService } from './image-manager.service';
import { Image } from "../models/images";
import { environment } from 'environments/environment';

describe('ImageManagerService', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;
  let httpServer: HttpController;
  let controller:Controller ;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, AppTestingModule],
      providers: [HttpController, ImageManagerService],
    });

    httpClient = TestBed.get(HttpClient);
    httpTestingController = TestBed.get(HttpTestingController);
    httpServer = TestBed.get(HttpController);
    controller = getTestServer();
    // service = TestBed.inject(ImageManagerService);
  });
  afterEach(() => {
    httpTestingController.verify();
  });


  it('should be get Images', inject([ImageManagerService], (service: ImageManagerService) => {
    service.getImages(controller).subscribe();
    const req = httpTestingController.expectOne(`http://127.0.0.1:3080/${environment.current_version}/images`);
    expect(req.request.method).toEqual('GET');
    expect(service).toBeTruthy();
  }));

  it('should add image', inject([ImageManagerService], (service: ImageManagerService) => {
    let  install_appliance = true
    const image: Image = {
      filename: '',
      path: '',
      image_type: '',
      image_size: 0,
      checksum: '',
      checksum_algorithm: '',
      created_at: '',
      updated_at: '',
    };

    service.uploadedImage(controller, install_appliance, image.filename, image).subscribe();
    const req = httpTestingController.expectOne(`http://127.0.0.1:3080/${environment.current_version}/images/upload/?install_appliances=true`);
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(image);
  }));
});

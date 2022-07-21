import { Injectable } from '@angular/core';
import{ Controller } from '../models/controller';
import { HttpServer } from './http-server.service';
import { Observable } from 'rxjs';
import { Image } from "../models/images";
import { environment } from 'environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ImageManagerService {

  constructor(private httpServer: HttpServer) { }

  getImages(controller:Controller ) {
    return this.httpServer.get<Image[]>(controller, '/images') as Observable<Image[]>;
  }

  getImagePath(controller :Controller, install_appliance, image_path){
    return `${controller.protocol}//${controller.host}:${controller.port}/${environment.current_version}/images/upload/${image_path}?install_appliances=${install_appliance}`;
  }

  getUploadPath(controller:Controller , emulator: string, filename: string) {
    return `${controller.protocol}//${controller.host}:${controller.port}/${environment.current_version}/images/upload/${filename}`;
  }

  uploadedImage(controller :Controller, install_appliance, image_path, flie){
    return this.httpServer.post<Image[]>(controller, `/images/upload/${image_path}?install_appliances=${install_appliance}`,flie) as Observable<Image[]>;
  }
  deleteFile(controller :Controller, image_path){
    return this.httpServer.delete<Image[]>(controller, `/images/${image_path}`) as Observable<Image[]>;
  }
}

import { Injectable } from '@angular/core';
import { Server } from '../models/server';
import { HttpServer } from './http-server.service';
import { Observable } from 'rxjs';
import { Image } from "../models/images";
import { environment } from 'environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ImageManagerService {

  constructor(private httpServer: HttpServer) { }

  getImages(server: Server) {
    return this.httpServer.get<Image[]>(server, '/images') as Observable<Image[]>;
  }

  getImagePath(server:Server, install_appliance, image_path){
    return `${server.protocol}//${server.host}:${server.port}/${environment.current_version}/images/upload/${image_path}?install_appliances=${install_appliance}`;
  }

  getUploadPath(server: Server, emulator: string, filename: string) {
    return `${server.protocol}//${server.host}:${server.port}/${environment.current_version}/images/upload/${filename}`;
  }

  uploadedImage(server:Server, install_appliance, image_path, flie){
    return this.httpServer.post<Image[]>(server, `/images/upload/${image_path}?install_appliances=${install_appliance}`,flie) as Observable<Image[]>;
  }
  deleteFile(server:Server, image_path){
    return this.httpServer.delete<Image[]>(server, `/images/${image_path}`) as Observable<Image[]>;
  }
}

import { Injectable } from '@angular/core';
import { Server } from '../models/server';
import { HttpServer } from './http-server.service';
import { merge, Observable, Subscription } from 'rxjs';
import { Images } from "../models/images";

@Injectable({
  providedIn: 'root'
})
export class ImageManagerService {

  constructor(private httpServer: HttpServer) { }

  getSavedImgList(server: Server) {
    return this.httpServer.get<Images[]>(server, '/images') as Observable<Images[]>;
  }
  uploadedImage(server:Server, image_path, flie){
    return this.httpServer.post<Images[]>(server, `/images/upload/${image_path}?install_appliances=true`,flie) as Observable<Images[]>;
  }
  deleteImage(server:Server, image_path){
    return this.httpServer.delete<Images[]>(server, `/images/${image_path}`) as Observable<Images[]>;
  }
}

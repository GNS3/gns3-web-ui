import { Pipe, PipeTransform } from '@angular/core';
import { Console } from 'console';
import { Server } from '../models/server';
import { HttpServer } from '../services/http-server.service';

@Pipe({
    name: 'authImage'
})
export class AuthImageFilter implements PipeTransform {
  
    constructor(
        private httpServer: HttpServer
    ) {}
  
    async transform(src: string, server: Server) {
        let url = src.split('v3')[1];
        const imageBlob: Blob = await this.httpServer.getBlob(server, url).toPromise();
        const reader = new FileReader();
        return new Promise((resolve, reject) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(imageBlob);
        });
    }
}

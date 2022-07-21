import { Pipe, PipeTransform } from '@angular/core';
import { Console } from 'console';
import{ Controller } from '../models/controller';
import { HttpController } from '../services/http-controller.service';
import { DomSanitizer } from '@angular/platform-browser';
import { environment } from 'environments/environment';

@Pipe({
    name: 'authImage'
})
export class AuthImageFilter implements PipeTransform {

    constructor(
        private httpServer: HttpController,
        private domSanitizer: DomSanitizer
    ) { }

    async transform(src: string, controller:Controller ) {
        let url = src.split(`${environment.current_version}`)[1];
        const imageBlob: Blob = await this.httpServer.getBlob(controller, url).toPromise();
        const reader = new FileReader();
        return new Promise((resolve, reject) => {
            reader.onloadend = () => resolve(this.domSanitizer.bypassSecurityTrustUrl(reader.result as string));
            reader.readAsDataURL(imageBlob);
        });
    }
}

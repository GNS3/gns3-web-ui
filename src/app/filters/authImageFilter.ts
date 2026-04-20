import { Pipe, PipeTransform, inject } from '@angular/core';
import { Controller } from '@models/controller';
import { HttpController } from '@services/http-controller.service';
import { DomSanitizer } from '@angular/platform-browser';
import { environment } from 'environments/environment';

@Pipe({
  standalone: true,
  name: 'authImage',
})
export class AuthImageFilter implements PipeTransform {
  private httpController = inject(HttpController);
  private domSanitizer = inject(DomSanitizer);

  constructor() {}

  async transform(src: string, controller: Controller) {
    let url = src.split(`${environment.current_version}`)[1];
    const imageBlob: Blob = await this.httpController.getBlob(controller, url).toPromise();
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onloadend = () => resolve(this.domSanitizer.bypassSecurityTrustUrl(reader.result as string));
      reader.readAsDataURL(imageBlob);
    });
  }
}

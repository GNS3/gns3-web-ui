import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { ControllerErrorHandler } from '@services/http-controller.service';

@NgModule({
  imports: [CommonModule],
  declarations: [],
  providers: [ControllerErrorHandler],
})
export class AppTestingModule {
  constructor(iconRegistry: MatIconRegistry, sanitizer: DomSanitizer) {
    // Register SVG icons for testing
    iconRegistry.addSvgIcon('gns3', sanitizer.bypassSecurityTrustResourceUrl('./assets/gns3_icon.svg'));
    iconRegistry.addSvgIcon('gns3black', sanitizer.bypassSecurityTrustResourceUrl('./assets/gns3_icon_black.svg'));
  }
}

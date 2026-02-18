import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ControllerErrorHandler } from '@services/http-controller.service';

@NgModule({
  imports: [CommonModule],
  declarations: [],
  providers: [ControllerErrorHandler],
})
export class AppTestingModule {}

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ServerErrorHandler } from '../../services/http-server.service';

@NgModule({
  imports: [CommonModule],
  declarations: [],
  providers: [ServerErrorHandler],
})
export class AppTestingModule {}

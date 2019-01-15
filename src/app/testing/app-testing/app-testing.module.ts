import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServerErrorHandler } from '../../services/http-server.service';

@NgModule({
  imports: [CommonModule],
  declarations: [],
  providers: [ServerErrorHandler]
})
export class AppTestingModule {}

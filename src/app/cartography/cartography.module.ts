import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapComponent } from './components/map/map.component';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [MapComponent],
  exports: [MapComponent]
})
export class CartographyModule { }

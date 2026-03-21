import { Component, Input, OnInit } from '@angular/core';
import { ImageElement } from '../../../../../models/drawings/image-element';

@Component({
  standalone: true,
  selector: '[app-image]',
  templateUrl: './image.component.html',
  styleUrls: ['./image.component.scss'],
  imports: []
})
export class ImageComponent implements OnInit {
  @Input('app-image') image: ImageElement;
  data:any

  ngOnInit() {}
}

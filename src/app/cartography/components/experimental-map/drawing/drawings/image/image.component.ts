import { Component, Input, OnInit } from '@angular/core';
import { ImageElement } from '../../../../../models/drawings/image-element';

@Component({
  selector: '[app-image]',
  templateUrl: './image.component.html',
  styleUrls: ['./image.component.scss'],
})
export class ImageComponent implements OnInit {
  @Input('app-image') image: ImageElement;
  data:any

  constructor() {}

  ngOnInit() {}
}

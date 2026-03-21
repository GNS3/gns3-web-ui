import { Component, OnInit, input } from '@angular/core';
import { ImageElement } from '../../../../../models/drawings/image-element';

@Component({
  standalone: true,
  selector: '[app-image]',
  templateUrl: './image.component.html',
  styleUrls: ['./image.component.scss'],
  imports: [],
})
export class ImageComponent implements OnInit {
  readonly image = input<ImageElement>(undefined, { alias: 'app-image' });
  data: any;

  ngOnInit() {}
}

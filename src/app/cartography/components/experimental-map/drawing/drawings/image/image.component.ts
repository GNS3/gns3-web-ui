import { Component, OnInit, input, ChangeDetectionStrategy } from '@angular/core';
import { ImageElement } from '../../../../../models/drawings/image-element';

@Component({
  selector: '[app-image]',
  templateUrl: './image.component.html',
  styleUrl: './image.component.scss',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageComponent implements OnInit {
  readonly image = input<ImageElement>(undefined, { alias: 'app-image' });
  data: any;

  ngOnInit() {}
}

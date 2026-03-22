import { Component, OnInit, input, ChangeDetectionStrategy } from '@angular/core';
import { ImageElement } from '../../../../../models/drawings/image-element';

@Component({
  standalone: true,
  selector: '[app-image]',
  templateUrl: './image.component.html',
  styleUrls: ['./image.component.scss'],
  imports: [],
  // TODO: This component has been partially migrated to be zoneless-compatible.
  // After testing, this should be updated to ChangeDetectionStrategy.OnPush.
  changeDetection: ChangeDetectionStrategy.Default,
})
export class ImageComponent implements OnInit {
  readonly image = input<ImageElement>(undefined, { alias: 'app-image' });
  data: any;

  ngOnInit() {}
}

import { Component, OnInit, Input } from '@angular/core';
import { RectElement } from '../../../../../models/drawings/rect-element';
import { QtDasharrayFixer } from '../../../../../helpers/qt-dasharray-fixer';

@Component({
  selector: '[app-rect]',
  templateUrl: './rect.component.html',
  styleUrls: ['./rect.component.scss']
})
export class RectComponent implements OnInit {
  @Input('app-rect') rect: RectElement;

  constructor(private qtDasharrayFixer: QtDasharrayFixer) {}

  ngOnInit() {}

  get fill_opacity() {
    if (isFinite(this.rect.fill_opacity)) {
      return this.rect.fill_opacity;
    }
    return null;
  }

  get stroke_width() {
    if (isFinite(this.rect.stroke_width)) {
      return this.rect.stroke_width;
    }
    return null;
  }

  get stroke_dasharray() {
    if (this.rect.stroke_dasharray) {
      return this.qtDasharrayFixer.fix(this.rect.stroke_dasharray);
    }
    return null;
  }
}

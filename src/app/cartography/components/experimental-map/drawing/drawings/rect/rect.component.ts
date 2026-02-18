import { Component, Input, OnInit } from '@angular/core';
import { QtDasharrayFixer } from '../../../../../helpers/qt-dasharray-fixer';
import { RectElement } from '../../../../../models/drawings/rect-element';

@Component({
  selector: '[app-rect]',
  templateUrl: './rect.component.html',
  styleUrls: ['./rect.component.scss'],
})
export class RectComponent implements OnInit {
  @Input('app-rect') rect: RectElement;

  constructor(private qtDasharrayFixer: QtDasharrayFixer) {}

  ngOnInit() {}

  get fill_opacity() {
    if (this.rect && isFinite(this.rect.fill_opacity)) {
      return this.rect.fill_opacity ? this.rect.fill_opacity : null;
    }
    return null;
  }

  get stroke_width() {
    if (this.rect && isFinite(this.rect.stroke_width)) {
      return this.rect.stroke_width ? this.rect.stroke_width : null;
    }
    return null;
  }

  get stroke_dasharray() {
    if (this.rect && this.rect.stroke_dasharray) {
      return this.qtDasharrayFixer.fix(this.rect.stroke_dasharray);
    }
    return null;
  }
}

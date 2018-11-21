import { Component, OnInit, Input } from '@angular/core';
import { EllipseElement } from '../../../../../models/drawings/ellipse-element';
import { QtDasharrayFixer } from '../../../../../helpers/qt-dasharray-fixer';

@Component({
  selector: '[app-ellipse]',
  templateUrl: './ellipse.component.html',
  styleUrls: ['./ellipse.component.scss']
})
export class EllipseComponent implements OnInit {
  @Input('app-ellipse') ellipse: EllipseElement;
  
  constructor(
    private qtDasharrayFixer: QtDasharrayFixer
    ) { }

  ngOnInit() {
  }

  get fill_opacity() {
    if(isFinite(this.ellipse.fill_opacity)) {
      return this.ellipse.fill_opacity;
    }
    return null;
  }

  get stroke_width() {
    if(isFinite(this.ellipse.stroke_width)) {
      return this.ellipse.stroke_width;
    }
    return null
  }

  get stroke_dasharray() {
    if(this.ellipse.stroke_dasharray) {
      return this.qtDasharrayFixer.fix(this.ellipse.stroke_dasharray);
    }
    return null;
  }
}

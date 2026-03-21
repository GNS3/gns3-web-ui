import { Component, Input, OnInit, inject } from '@angular/core';
import { QtDasharrayFixer } from '../../../../../helpers/qt-dasharray-fixer';
import { EllipseElement } from '../../../../../models/drawings/ellipse-element';

@Component({
  standalone: true,
  selector: '[app-ellipse]',
  templateUrl: './ellipse.component.html',
  styleUrls: ['./ellipse.component.scss'],
  imports: []
})
export class EllipseComponent implements OnInit {
  @Input('app-ellipse') ellipse: EllipseElement;

  private qtDasharrayFixer = inject(QtDasharrayFixer);

  ngOnInit() {}

  get fill_opacity() {
    if (this.ellipse && isFinite(this.ellipse.fill_opacity)) {
      return this.ellipse.fill_opacity;
    }
    return null;
  }

  get stroke_width() {
    if (this.ellipse && isFinite(this.ellipse.stroke_width)) {
      return this.ellipse.stroke_width;
    }
    return null;
  }

  get stroke_dasharray() {
    if (this.ellipse &&  this.ellipse.stroke_dasharray) {
      return this.qtDasharrayFixer.fix(this.ellipse.stroke_dasharray);
    }
    return null;
  }
}

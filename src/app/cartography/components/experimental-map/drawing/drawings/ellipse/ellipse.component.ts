import { Component, OnInit, inject, input } from '@angular/core';
import { QtDasharrayFixer } from '../../../../../helpers/qt-dasharray-fixer';
import { EllipseElement } from '../../../../../models/drawings/ellipse-element';

@Component({
  standalone: true,
  selector: '[app-ellipse]',
  templateUrl: './ellipse.component.html',
  styleUrls: ['./ellipse.component.scss'],
  imports: [],
})
export class EllipseComponent implements OnInit {
  readonly ellipse = input<EllipseElement>(undefined, { alias: 'app-ellipse' });

  private qtDasharrayFixer = inject(QtDasharrayFixer);

  ngOnInit() {}

  get fill_opacity() {
    const ellipse = this.ellipse();
    if (ellipse && isFinite(ellipse.fill_opacity)) {
      return ellipse.fill_opacity;
    }
    return null;
  }

  get stroke_width() {
    const ellipse = this.ellipse();
    if (ellipse && isFinite(ellipse.stroke_width)) {
      return ellipse.stroke_width;
    }
    return null;
  }

  get stroke_dasharray() {
    const ellipse = this.ellipse();
    if (ellipse && ellipse.stroke_dasharray) {
      return this.qtDasharrayFixer.fix(ellipse.stroke_dasharray);
    }
    return null;
  }
}

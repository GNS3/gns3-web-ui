import { Component, OnInit, inject, input, ChangeDetectionStrategy } from '@angular/core';
import { QtDasharrayFixer } from '../../../../../helpers/qt-dasharray-fixer';
import { RectElement } from '../../../../../models/drawings/rect-element';

@Component({
  selector: '[app-rect]',
  templateUrl: './rect.component.html',
  styleUrl: './rect.component.scss',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RectComponent implements OnInit {
  readonly rect = input<RectElement>(undefined, { alias: 'app-rect' });

  private qtDasharrayFixer = inject(QtDasharrayFixer);

  ngOnInit() {}

  get fill_opacity() {
    const rect = this.rect();
    if (rect && isFinite(rect.fill_opacity)) {
      return rect.fill_opacity ? rect.fill_opacity : null;
    }
    return null;
  }

  get stroke_width() {
    const rect = this.rect();
    if (rect && isFinite(rect.stroke_width)) {
      return rect.stroke_width ? rect.stroke_width : null;
    }
    return null;
  }

  get stroke_dasharray() {
    const rect = this.rect();
    if (rect && rect.stroke_dasharray) {
      return this.qtDasharrayFixer.fix(rect.stroke_dasharray);
    }
    return null;
  }
}

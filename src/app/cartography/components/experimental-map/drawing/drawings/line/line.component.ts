import { Component, OnInit, Input } from '@angular/core';
import { QtDasharrayFixer } from '../../../../../helpers/qt-dasharray-fixer';
import { LineElement } from '../../../../../models/drawings/line-element';

@Component({
  selector: '[app-line]',
  templateUrl: './line.component.html',
  styleUrls: ['./line.component.scss']
})
export class LineComponent implements OnInit {
  @Input('app-line') line: LineElement;

  constructor(private qtDasharrayFixer: QtDasharrayFixer) {}

  ngOnInit() {}

  get stroke_width() {
    if (isFinite(this.line.stroke_width)) {
      return this.line.stroke_width;
    }
    return null;
  }

  get stroke_dasharray() {
    if (this.line.stroke_dasharray) {
      return this.qtDasharrayFixer.fix(this.line.stroke_dasharray);
    }
    return null;
  }
}

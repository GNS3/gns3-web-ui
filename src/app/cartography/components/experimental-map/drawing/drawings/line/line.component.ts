import { Component, Input, OnInit, inject } from '@angular/core';
import { QtDasharrayFixer } from '../../../../../helpers/qt-dasharray-fixer';
import { LineElement } from '../../../../../models/drawings/line-element';

@Component({
  standalone: true,
  selector: '[app-line]',
  templateUrl: './line.component.html',
  styleUrls: ['./line.component.scss'],
  imports: []
})
export class LineComponent implements OnInit {
  @Input('app-line') line: LineElement;

  private qtDasharrayFixer = inject(QtDasharrayFixer);

  ngOnInit() {}

  get stroke_width() {
    if (this.line && isFinite(this.line.stroke_width)) {
      return this.line.stroke_width;
    }
    return null;
  }

  get stroke_dasharray() {
    if ( this.line && this.line.stroke_dasharray) {
      return this.qtDasharrayFixer.fix(this.line.stroke_dasharray);
    }
    return null;
  }
}

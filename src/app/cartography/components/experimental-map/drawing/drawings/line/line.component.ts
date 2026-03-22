import { Component, OnInit, inject, input, ChangeDetectionStrategy } from '@angular/core';
import { QtDasharrayFixer } from '../../../../../helpers/qt-dasharray-fixer';
import { LineElement } from '../../../../../models/drawings/line-element';

@Component({
  standalone: true,
  selector: '[app-line]',
  templateUrl: './line.component.html',
  styleUrls: ['./line.component.scss'],
  imports: [],
  // TODO: This component has been partially migrated to be zoneless-compatible.
  // After testing, this should be updated to ChangeDetectionStrategy.OnPush.
  changeDetection: ChangeDetectionStrategy.Default,
})
export class LineComponent implements OnInit {
  readonly line = input<LineElement>(undefined, { alias: 'app-line' });

  private qtDasharrayFixer = inject(QtDasharrayFixer);

  ngOnInit() {}

  get stroke_width() {
    const line = this.line();
    if (line && isFinite(line.stroke_width)) {
      return line.stroke_width;
    }
    return null;
  }

  get stroke_dasharray() {
    const line = this.line();
    if (line && line.stroke_dasharray) {
      return this.qtDasharrayFixer.fix(line.stroke_dasharray);
    }
    return null;
  }
}

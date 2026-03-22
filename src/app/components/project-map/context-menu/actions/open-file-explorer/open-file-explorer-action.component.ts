import { ChangeDetectionStrategy, Component, OnInit, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';

@Component({
  selector: 'app-open-file-explorer-action',
  templateUrl: './open-file-explorer-action.component.html',
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpenFileExplorerActionComponent implements OnInit {
  readonly controller = input<Controller>(undefined);
  readonly node = input<Node>(undefined);

  ngOnInit() {}

  open() {
    // Opening file explorer is not supported in web mode
    console.log('Opening file explorer is only supported in Electron mode');
  }
}

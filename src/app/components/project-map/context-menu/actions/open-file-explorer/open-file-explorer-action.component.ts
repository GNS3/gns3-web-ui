import { Component, Input, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';

@Component({
  standalone: true,
  selector: 'app-open-file-explorer-action',
  templateUrl: './open-file-explorer-action.component.html',
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
})
export class OpenFileExplorerActionComponent implements OnInit {
  @Input() controller: Controller;
  @Input() node: Node;

  ngOnInit() {}

  open() {
    // Opening file explorer is not supported in web mode
    console.log('Opening file explorer is only supported in Electron mode');
  }
}

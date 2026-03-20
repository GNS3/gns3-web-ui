import { Component, Input, OnInit } from '@angular/core';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';

@Component({
  selector: 'app-open-file-explorer-action',
  templateUrl: './open-file-explorer-action.component.html',
})
export class OpenFileExplorerActionComponent implements OnInit {
  @Input() controller: Controller;
  @Input() node: Node;

  constructor() {}

  ngOnInit() {}

  open() {
    // Opening file explorer is not supported in web mode
    console.log('Opening file explorer is only supported in Electron mode');
  }
}

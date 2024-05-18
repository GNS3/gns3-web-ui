import { Component, Input, OnInit } from '@angular/core';
import { ElectronService } from 'ngx-electron';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '../../../../../models/controller';

@Component({
  selector: 'app-open-file-explorer-action',
  templateUrl: './open-file-explorer-action.component.html',
})
export class OpenFileExplorerActionComponent implements OnInit {
  @Input() controller:Controller ;
  @Input() node: Node;

  constructor(private electronService: ElectronService) {}

  ngOnInit() {}

  open() {
    this.electronService.shell.openPath(this.node.node_directory);
  }
}

import { Component, Input, OnInit } from '@angular/core';
import { ElectronService } from 'ngx-electron';
import { Node } from '../../../../../cartography/models/node';
import { Server } from '../../../../../models/server';


@Component({
  selector: 'app-open-file-explorer-action',
  templateUrl: './open-file-explorer-action.component.html'
})
export class OpenFileExplorerActionComponent implements OnInit {
  @Input() server: Server;
  @Input() node: Node;

  constructor(
    private electronService: ElectronService
  ) {}

  ngOnInit() {}

  open() {
    this.electronService.shell.openItem(this.node.node_directory);
  }
}

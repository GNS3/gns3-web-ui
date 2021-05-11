import { Component, Input, OnInit } from '@angular/core';
import { Node } from '../../../../../cartography/models/node';
import { Server } from '../../../../../models/server';
import { MapSettingsService } from '../../../../../services/mapsettings.service';
import { NodeConsoleService } from '../../../../../services/nodeConsole.service';
import { ToasterService } from '../../../../../services/toaster.service';

@Component({
  selector: 'app-http-console-action',
  templateUrl: './http-console-action.component.html',
})
export class HttpConsoleActionComponent implements OnInit {
  @Input() server: Server;
  @Input() nodes: Node[];

  constructor(
    private consoleService: NodeConsoleService,
    private toasterService: ToasterService,
    private mapSettingsService: MapSettingsService
  ) {}

  ngOnInit() {}

  openConsole() {
    this.nodes.forEach((n) => {
      if (n.status === 'started') {
        this.mapSettingsService.logConsoleSubject.next(true);
        // this timeout is required due to xterm.js implementation
        setTimeout(() => { this.consoleService.openConsoleForNode(n); }, 500);
      } else {
        this.toasterService.error('To open console please start the node ' + n.name);
      }
    });
  }
}

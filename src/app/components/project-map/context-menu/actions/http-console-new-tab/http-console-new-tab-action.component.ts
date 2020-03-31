import { Component, OnInit, Input } from '@angular/core';
import { Node } from '../../../../../cartography/models/node';
import { Server } from '../../../../../models/server';
import { ToasterService } from '../../../../../services/toaster.service';
import { Router } from '@angular/router';


@Component({
  selector: 'app-http-console-new-tab-action',
  templateUrl: './http-console-new-tab-action.component.html'
})
export class HttpConsoleNewTabActionComponent implements OnInit {
  @Input() server: Server;
  @Input() nodes: Node[];

  constructor(
    private toasterService: ToasterService,
    private router: Router
  ) { }

  ngOnInit() {}

  openConsole() {
    this.nodes.forEach(n => {
      if (n.status === 'started') {
        window.open(`${this.router.url}/nodes/${n.node_id}`);
      } else {
        this.toasterService.error('To open console please start the node');
      }
    });
  }
}

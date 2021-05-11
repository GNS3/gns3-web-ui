import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Node } from '../../../../../cartography/models/node';
import { Server } from '../../../../../models/server';
import { ToasterService } from '../../../../../services/toaster.service';

@Component({
  selector: 'app-http-console-new-tab-action',
  templateUrl: './http-console-new-tab-action.component.html',
})
export class HttpConsoleNewTabActionComponent implements OnInit {
  @Input() server: Server;
  @Input() nodes: Node[];

  constructor(private toasterService: ToasterService, private router: Router) {}

  ngOnInit() {}

  openConsole() {
    this.nodes.forEach((n) => {
      if (n.status === 'started') {
        let url = this.router.url.split('/');
        let urlString = `/static/web-ui/${url[1]}/${url[2]}/${url[3]}/${url[4]}/nodes/${n.node_id}`;
        window.open(urlString);
      } else {
        this.toasterService.error('To open console please start the node ' + n.name);
      }
    });
  }
}

import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { ServerService } from '../../services/server.service';
import { Server } from '../../models/server';

@Component({
  selector: 'app-local-server',
  templateUrl: './local-server.component.html',
  styleUrls: ['./local-server.component.scss']
})
export class LocalServerComponent implements OnInit {
  constructor(private router: Router, private serverService: ServerService) {}

  ngOnInit() {
    this.serverService.getLocalServer(location.hostname, parseInt(location.port, 10)).then((server: Server) => {
      this.router.navigate(['/server', server.id, 'projects']);
    });
  }
}

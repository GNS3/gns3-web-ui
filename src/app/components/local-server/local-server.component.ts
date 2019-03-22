import { Component, OnInit, Inject } from '@angular/core';
import { Router } from '@angular/router';

import { ServerService } from '../../services/server.service';
import { Server } from '../../models/server';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-local-server',
  templateUrl: './local-server.component.html',
  styleUrls: ['./local-server.component.scss']
})
export class LocalServerComponent implements OnInit {
  constructor(
    private router: Router,
    private serverService: ServerService,
    @Inject(DOCUMENT) private document) {}

  ngOnInit() {
    this.serverService.getLocalServer(
      this.document.location.hostname,
      parseInt(this.document.location.port, 10))
    .then((server: Server) => {
      this.router.navigate(['/server', server.id, 'projects']);
    });
  }
}

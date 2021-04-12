import { Component, OnInit, Inject } from '@angular/core';
import { Router } from '@angular/router';

import { ServerService } from '../../services/server.service';
import { Server } from '../../models/server';
import { DOCUMENT } from '@angular/common';
import { ProgressService } from '../../common/progress/progress.service';

@Component({
  selector: 'app-bundled-server-finder',
  templateUrl: './bundled-server-finder.component.html',
  styleUrls: ['./bundled-server-finder.component.scss'],
})
export class BundledServerFinderComponent implements OnInit {
  constructor(
    private router: Router,
    private serverService: ServerService,
    private progressService: ProgressService,
    @Inject(DOCUMENT) private document
  ) {}

  ngOnInit() {
    this.progressService.activate();
    setTimeout(() => {
      let port = parseInt(this.document.location.port, 10) ? parseInt(this.document.location.port, 10) : 80;

      this.serverService.getLocalServer(this.document.location.hostname, port).then((server: Server) => {
        this.progressService.deactivate();
        this.router.navigate(['/server', server.id, 'projects']);
      });
    }, 100);
  }
}

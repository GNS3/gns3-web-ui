import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProgressService } from '../../common/progress/progress.service';
import{ Controller } from '../../models/controller';
import { ControllerService } from '../../services/controller.service';

@Component({
  selector: 'app-bundled-server-finder',
  templateUrl: './bundled-server-finder.component.html',
  styleUrls: ['./bundled-server-finder.component.scss'],
})
export class BundledServerFinderComponent implements OnInit {
  constructor(
    private router: Router,
    private serverService: ControllerService,
    private progressService: ProgressService,
    @Inject(DOCUMENT) private document
  ) {}

  ngOnInit() {
    this.progressService.activate();
    setTimeout(() => {
      let port;
      
      if (parseInt(this.document.location.port, 10)) {
        port = parseInt(this.document.location.port, 10);
      } else if (this.document.location.protocol == "https:") {
        port = 443;
      } else {
        port = 80;
      }

      this.serverService.getLocalServer(this.document.location.hostname, port).then((controller:Controller ) => {
        this.router.navigate(['/controller', controller.id, 'projects']);
        this.progressService.deactivate();
      });
    }, 100);
  }
}

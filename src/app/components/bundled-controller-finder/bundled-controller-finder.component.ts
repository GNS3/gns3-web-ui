import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ProgressService } from '../../common/progress/progress.service';
import { ProgressComponent } from '../../common/progress/progress.component';
import { Controller } from '@models/controller';
import { ControllerService } from '@services/controller.service';

@Component({
  standalone: true,
  selector: 'app-bundled-controller-finder',
  templateUrl: './bundled-controller-finder.component.html',
  styleUrls: ['./bundled-controller-finder.component.scss'],
  imports: [ProgressComponent],
})
export class BundledControllerFinderComponent implements OnInit {
  private router = inject(Router);
  private controllerService = inject(ControllerService);
  private progressService = inject(ProgressService);

  constructor(@Inject(DOCUMENT) private document) {}

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

      this.controllerService.getLocalController(this.document.location.hostname, port).then((controller: Controller ) => {
        this.router.navigate(['/controller', controller.id, 'projects']);
        this.progressService.deactivate();
      });
    }, 100);
  }
}

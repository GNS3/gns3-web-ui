import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { forkJoin, from } from 'rxjs';
import { map } from 'rxjs//operators';
import { Observable } from 'rxjs/Rx';
import { Controller, ControllerProtocol } from '../../../models/controller';
import { Version } from '../../../models/version';
import { ControllerDatabase } from '../../../services/controller.database';
import { ControllerService } from '../../../services/controller.service';
import { VersionService } from '../../../services/version.service';

@Component({
  selector: 'app-controller-discovery',
  templateUrl: './controller-discovery.component.html',
  styleUrls: ['./controller-discovery.component.scss'],
})
export class ControllerDiscoveryComponent implements OnInit {
  private defaultControllers = [
    {
      host: '127.0.0.1',
      port: 3080,
    },
  ];

  discoveredController: Controller;

  constructor(
    private versionService: VersionService,
    private controllerService: ControllerService,
    private controllerDatabase: ControllerDatabase,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    if (this.controllerService.isServiceInitialized) this.discoverFirstController();
    this.controllerService.serviceInitialized.subscribe(async (value: boolean) => {
      if (value) {
        this.discoverFirstController();
      }
    });
  }

  async discoverFirstController() {
    let discovered = await this.discoverControllers();
    let local = await this.controllerService.findAll();

    local.forEach((added) => {
      discovered = discovered.filter((controller) => {
        return !(controller.host == added.host && controller.port == added.port);
      });
    });

    if (discovered.length > 0) {
      this.discoveredController = discovered.shift();
    }
  }

  async discoverControllers() {
    let discoveredControllers: Controller[] = [];
    this.defaultControllers.forEach(async (testController) => {
      const controller = new Controller();
      controller.host = testController.host;
      controller.port = testController.port;
      let version = await this.versionService
        .get(controller)
        .toPromise()
        .catch((error) => null);
      if (version) discoveredControllers.push(controller);
    });
    return discoveredControllers;
  }

  discoverFirstAvailableController() {
    forkJoin([from(this.controllerService.findAll()).pipe(map((s: Controller[]) => s)), this.discovery()]).subscribe(
      ([local, discovered]) => {
        local.forEach((added) => {
          discovered = discovered.filter((controller) => {
            return !(controller.host == added.host && controller.port == added.port);
          });
        });
        if (discovered.length > 0) {
          this.discoveredController = discovered.shift();
        }
      },
      (error) => {}
    );
  }

  discovery(): Observable<Controller[]> {
    const queries: Observable<Controller>[] = [];

    this.defaultControllers.forEach((testController) => {
      queries.push(
        this.isControllerAvailable(testController.host, testController.port).catch((err) => {
          return Observable.of(null);
        })
      );
    });

    return new Observable<Controller[]>((observer) => {
      forkJoin(queries).subscribe((discoveredControllers) => {
        observer.next(discoveredControllers.filter((s) => s != null));
        observer.complete();
      });
    });
  }

  isControllerAvailable(ip: string, port: number): Observable<Controller> {
    const controller = new Controller();
    controller.host = ip;
    controller.port = port;
    return this.versionService.get(controller).flatMap((version: Version) => Observable.of(controller));
  }

  ignore(controller: Controller) {
    this.discoveredController = null;
  }

  accept(controller: Controller) {
    if (controller.name == null) {
      controller.name = controller.host;
    }

    controller.location = 'remote';
    controller.protocol = location.protocol as ControllerProtocol;

    this.controllerService.create(controller).then((created: Controller) => {
      this.controllerDatabase.addController(created);
      this.discoveredController = null;
    });
  }
}

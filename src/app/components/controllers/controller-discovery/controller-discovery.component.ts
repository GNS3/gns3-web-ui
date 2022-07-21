import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { forkJoin, from } from 'rxjs';
import { map } from 'rxjs//operators';
import { Observable } from 'rxjs/Rx';
import { Controller, ServerProtocol } from '../../../models/controller';
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
  private defaultServers = [
    {
      host: '127.0.0.1',
      port: 3080,
    },
  ];

  discoveredServer: Controller;

  constructor(
    private versionService: VersionService,
    private serverService: ControllerService,
    private serverDatabase: ControllerDatabase,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    if (this.serverService.isServiceInitialized) this.discoverFirstServer();
    this.serverService.serviceInitialized.subscribe(async (value: boolean) => {
      if (value) {
        this.discoverFirstServer();
      }
    });
  }

  async discoverFirstServer() {
    let discovered = await this.discoverServers();
    let local = await this.serverService.findAll();

    local.forEach((added) => {
      discovered = discovered.filter((controller) => {
        return !(controller.host == added.host && controller.port == added.port);
      });
    });

    if (discovered.length > 0) {
      this.discoveredServer = discovered.shift();
    }
  }

  async discoverServers() {
    let discoveredServers: Controller[] = [];
    this.defaultServers.forEach(async (testServer) => {
      const controller = new Controller();
      controller.host = testServer.host;
      controller.port = testServer.port;
      let version = await this.versionService
        .get(controller)
        .toPromise()
        .catch((error) => null);
      if (version) discoveredServers.push(controller);
    });
    return discoveredServers;
  }

  discoverFirstAvailableServer() {
    forkJoin([from(this.serverService.findAll()).pipe(map((s: Controller[]) => s)), this.discovery()]).subscribe(
      ([local, discovered]) => {
        local.forEach((added) => {
          discovered = discovered.filter((controller) => {
            return !(controller.host == added.host && controller.port == added.port);
          });
        });
        if (discovered.length > 0) {
          this.discoveredServer = discovered.shift();
        }
      },
      (error) => {}
    );
  }

  discovery(): Observable<Controller[]> {
    const queries: Observable<Controller>[] = [];

    this.defaultServers.forEach((testServer) => {
      queries.push(
        this.isServerAvailable(testServer.host, testServer.port).catch((err) => {
          return Observable.of(null);
        })
      );
    });

    return new Observable<Controller[]>((observer) => {
      forkJoin(queries).subscribe((discoveredServers) => {
        observer.next(discoveredServers.filter((s) => s != null));
        observer.complete();
      });
    });
  }

  isServerAvailable(ip: string, port: number): Observable<Controller> {
    const controller = new Controller();
    controller.host = ip;
    controller.port = port;
    return this.versionService.get(controller).flatMap((version: Version) => Observable.of(controller));
  }

  ignore(controller: Controller) {
    this.discoveredServer = null;
  }

  accept(controller: Controller) {
    if (controller.name == null) {
      controller.name = controller.host;
    }

    controller.location = 'remote';
    controller.protocol = location.protocol as ServerProtocol;

    this.serverService.create(controller).then((created: Controller) => {
      this.serverDatabase.addServer(created);
      this.discoveredServer = null;
    });
  }
}

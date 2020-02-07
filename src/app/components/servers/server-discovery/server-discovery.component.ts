import { Component, OnInit } from '@angular/core';

import { map } from 'rxjs//operators';
import { Observable } from 'rxjs/Rx';

import { forkJoin } from 'rxjs';
import { Server } from '../../../models/server';
import { Version } from '../../../models/version';
import { ServerDatabase } from '../../../services/server.database';
import { ServerService } from '../../../services/server.service';
import { VersionService } from '../../../services/version.service';

@Component({
  selector: 'app-server-discovery',
  templateUrl: './server-discovery.component.html',
  styleUrls: ['./server-discovery.component.scss']
})
export class ServerDiscoveryComponent implements OnInit {
  private defaultServers = [
    {
      host: '127.0.0.1',
      port: 3080
    }
  ];

  discoveredServer: Server;

  constructor(
    private versionService: VersionService,
    private serverService: ServerService,
    private serverDatabase: ServerDatabase
  ) {}

  ngOnInit() {
    this.discoverFirstAvailableServer();
  }

  discoverFirstAvailableServer() {
    forkJoin(
      Observable.fromPromise(this.serverService.findAll()).pipe(map((s: Server[]) => s)),
      this.discovery()
    ).subscribe(([local, discovered]) => {
      local.forEach(added => {
        discovered = discovered.filter(server => {
          return !(server.host == added.host && server.port == added.port);
        });
      });
      if (discovered.length > 0) {
        this.discoveredServer = discovered.shift();
      }
    });
  }

  discovery(): Observable<Server[]> {
    const queries: Array<Observable<Server>> = [];

    this.defaultServers.forEach(testServer => {
      queries.push(
        this.isServerAvailable(testServer.host, testServer.port).catch(err => {
          return Observable.of(null);
        })
      );
    });

    return new Observable<Server[]>(observer => {
      forkJoin(queries).subscribe(discoveredServers => {
        observer.next(discoveredServers.filter(s => s != null));
        observer.complete();
      });
    });
  }

  isServerAvailable(ip: string, port: number): Observable<Server> {
    const server = new Server();
    server.host = ip;
    server.port = port;
    return this.versionService.get(server).flatMap((version: Version) => Observable.of(server));
  }

  ignore(server: Server) {
    this.discoveredServer = null;
  }

  accept(server: Server) {
    if (server.name == null) {
      server.name = server.host;
    }

    server.location = 'remote';

    this.serverService.create(server).then((created: Server) => {
      this.serverDatabase.addServer(created);
      this.discoveredServer = null;
    });
  }
}

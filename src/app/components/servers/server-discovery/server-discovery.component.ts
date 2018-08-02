import { Component, OnInit } from '@angular/core';
import { Server } from "../../../models/server";
import { VersionService } from "../../../services/version.service";
import {Version} from "../../../models/version";
import {Observable} from "rxjs/Rx";

@Component({
  selector: 'app-server-discovery',
  templateUrl: './server-discovery.component.html',
  styleUrls: ['./server-discovery.component.scss']
})
export class ServerDiscoveryComponent implements OnInit {
  private defaultServers = [{
      ip: '127.0.0.1',
      port: 3080
    }
  ];

  constructor(
    private versionService: VersionService
  ) {}

  ngOnInit() {

  }

  discovery(servers: Server[]): Observable<Server> {
    // this.defaultServers.forEach(());
    return Observable.of(new Server());
  }

  isServerAvailable(ip: string, port: number): Observable<Version> {
    const server = new Server();
    server.ip = ip;
    server.port = port;
    return this.versionService.get(server);
  }
}

import { Component, OnInit } from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {Server} from "@models/server";
import {ServerService} from "@services/server.service";

@Component({
  selector: 'app-management',
  templateUrl: './management.component.html',
  styleUrls: ['./management.component.scss']
})
export class ManagementComponent implements OnInit {

  server: Server;
  links = ['users', 'groups'];
  activeLink: string = this.links[0];

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private serverService: ServerService) { }

  ngOnInit(): void {
    const serverId = this.route.snapshot.paramMap.get('server_id');
    this.serverService.get(+serverId).then((server: Server) => {
      this.server = server;
    });
  }
}

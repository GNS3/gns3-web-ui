import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';

import { Project } from "../models/project";
import { ProjectService } from "../services/project.service";
import { Server } from "../models/server";
import { ServerService } from "../services/server.service";

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.css']
})
export class ProjectsComponent implements OnInit {
  server: Server;
  projects: Project[] = [];

  constructor(private route: ActivatedRoute,
              private serverService: ServerService,
              private projectService: ProjectService) { }

  ngOnInit() {
    this.route.paramMap
      .switchMap((params: ParamMap) => {
        const server_id = parseInt(params.get('server_id'), 10);
        return this.serverService.get(server_id);
      })
      .subscribe((server: Server) => {
        this.server = server;

        this.projectService
          .list(server)
          .subscribe((projects: Project[]) => {
            this.projects = projects;
          });
      });
  }

}

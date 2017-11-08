import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';

import { Project } from "../shared/models/project";
import { ProjectService } from "../shared/services/project.service";
import { Server } from "../shared/models/server";
import { ServerService } from "../shared/services/server.service";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { DataSource } from "@angular/cdk/collections";
import { Observable } from "rxjs/Observable";

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.css']
})
export class ProjectsComponent implements OnInit {
  server: Server;
  projectDatabase = new ProjectDatabase();
  dataSource: ProjectDataSource;
  displayedColumns = ['name', 'actions'];

  constructor(private route: ActivatedRoute,
              private serverService: ServerService,
              private projectService: ProjectService) {
    this.dataSource = new ProjectDataSource(this.projectDatabase);
  }

  ngOnInit() {
    this.route.paramMap
      .switchMap((params: ParamMap) => {
        const server_id = parseInt(params.get('server_id'), 10);
        return this.serverService.get(server_id);
      })
      .subscribe((server: Server) => {
        this.server = server;
        this.projectService
          .list(this.server)
          .subscribe((projects: Project[]) => {
            this.projectDatabase.addProjects(projects);
          });
      });
  }

  delete(project: Project) {
    this.projectService.delete(this.server, project.project_id).subscribe(() => {
      this.projectDatabase.remove(project);
    });
  }

}


export class ProjectDatabase {
  dataChange: BehaviorSubject<Project[]> = new BehaviorSubject<Project[]>([]);

  get data(): Project[] {
    return this.dataChange.value;
  }

  public addProjects(projects: Project[]) {
    this.dataChange.next(projects);
  }

  public remove(project: Project) {
    const index = this.data.indexOf(project);
    if (index >= 0) {
      this.data.splice(index, 1);
      this.dataChange.next(this.data.slice());
    }
  }
}

export class ProjectDataSource extends DataSource<any> {
  constructor(private projectDatabase: ProjectDatabase) {
    super();
  }

  connect(): Observable<Project[]> {
    return Observable.merge(this.projectDatabase.dataChange).map(() => {
      return this.projectDatabase.data;
    });
  }

  disconnect() {}

}

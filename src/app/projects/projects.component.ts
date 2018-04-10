import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { MatSort, MatSortable } from "@angular/material";

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

  @ViewChild(MatSort) sort: MatSort;

  constructor(private route: ActivatedRoute,
              private serverService: ServerService,
              private projectService: ProjectService) {

  }

  ngOnInit() {
    this.sort.sort(<MatSortable>{
        id: 'name',
        start: 'asc'
      }
    );

    this.dataSource = new ProjectDataSource(this.projectDatabase, this.sort);

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

  constructor(private projectDatabase: ProjectDatabase, private sort: MatSort) {
    super();
  }

  connect(): Observable<Project[]> {
    const displayDataChanges = [
      this.projectDatabase.dataChange,
      this.sort.sortChange,
    ];

    return Observable.merge(...displayDataChanges).map(() => {
      if (!this.sort.active || this.sort.direction === '') {
        return this.projectDatabase.data;
      }

      return this.projectDatabase.data.sort((a, b) => {
        const propertyA = a[this.sort.active];
        const propertyB = b[this.sort.active];

        const valueA = isNaN(+propertyA) ? propertyA : +propertyA;
        const valueB = isNaN(+propertyB) ? propertyB : +propertyB;

        return (valueA < valueB ? -1 : 1) * (this.sort.direction === 'asc' ? 1 : -1);
      });
    });
  }

  disconnect() {}

}

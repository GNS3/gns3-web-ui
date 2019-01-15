import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { MatSort, MatSortable, MatDialog } from '@angular/material';

import { DataSource } from '@angular/cdk/collections';

import { map, switchMap } from 'rxjs//operators';
import { BehaviorSubject, Observable, merge } from 'rxjs';

import { Project } from '../../models/project';
import { ProjectService } from '../../services/project.service';
import { Server } from '../../models/server';
import { ServerService } from '../../services/server.service';
import { SettingsService, Settings } from '../../services/settings.service';
import { ProgressService } from '../../common/progress/progress.service';

import { ImportProjectDialogComponent } from './import-project-dialog/import-project-dialog.component';
import { AddBlankProjectDialogComponent } from './add-blank-project-dialog/add-blank-project-dialog.component';

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
  settings: Settings;

  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private route: ActivatedRoute,
    private serverService: ServerService,
    private projectService: ProjectService,
    private settingsService: SettingsService,
    private progressService: ProgressService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.sort.sort(<MatSortable>{
      id: 'name',
      start: 'asc'
    });
    this.dataSource = new ProjectDataSource(this.projectDatabase, this.sort);

    this.route.paramMap
      .pipe(
        switchMap((params: ParamMap) => {
          const server_id = params.get('server_id');
          return this.serverService.get(parseInt(server_id, 10));
        })
      )
      .subscribe((server: Server) => {
        this.server = server;
        this.refresh();
      });

    this.settings = this.settingsService.getAll();
  }

  refresh() {
    this.projectService.list(this.server).subscribe(
      (projects: Project[]) => {
        this.projectDatabase.addProjects(projects);
      },
      error => {
        this.progressService.setError(error);
      }
    );
  }

  delete(project: Project) {
    this.projectService.delete(this.server, project.project_id).subscribe(() => {
      this.projectDatabase.remove(project);
    });
  }

  open(project: Project) {
    this.progressService.activate();

    this.projectService.open(this.server, project.project_id).subscribe(
      () => {
        this.refresh();
      },
      () => {},
      () => {
        this.progressService.deactivate();
      }
    );
  }

  close(project: Project) {
    this.progressService.activate();

    this.projectService.close(this.server, project.project_id).subscribe(
      () => {
        this.refresh();
      },
      () => {},
      () => {
        this.progressService.deactivate();
      }
    );
  }

  addBlankProject() {
    const dialogRef = this.dialog.open(AddBlankProjectDialogComponent, {
      width: '550px'
    });
    let instance = dialogRef.componentInstance;
    instance.server = this.server;
  }

  importProject() {
    const dialogRef = this.dialog.open(ImportProjectDialogComponent, {
      width: '550px'
    });
    let instance = dialogRef.componentInstance;
    instance.server = this.server;

    dialogRef.afterClosed().subscribe(() => {
      this.refresh();
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

export class ProjectDataSource extends DataSource<any> {
  constructor(private projectDatabase: ProjectDatabase, private sort: MatSort) {
    super();
  }

  connect(): Observable<Project[]> {
    const displayDataChanges = [this.projectDatabase.dataChange, this.sort.sortChange];

    return merge(...displayDataChanges).pipe(
      map(() => {
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
      })
    );
  }

  disconnect() {}
}

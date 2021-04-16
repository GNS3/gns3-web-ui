import { DataSource } from '@angular/cdk/collections';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatDialog } from '@angular/material/dialog';
import { MatSort, MatSortable } from '@angular/material/sort';
import { ActivatedRoute, Router } from '@angular/router';
import { ElectronService } from 'ngx-electron';
import { BehaviorSubject, merge, Observable } from 'rxjs';
import { map } from 'rxjs//operators';
import { ProgressService } from '../../common/progress/progress.service';
import { Project } from '../../models/project';
import { Server } from '../../models/server';
import { ProjectService } from '../../services/project.service';
import { RecentlyOpenedProjectService } from '../../services/recentlyOpenedProject.service';
import { Settings, SettingsService } from '../../services/settings.service';
import { ToasterService } from '../../services/toaster.service';
import { ConfigureGns3VMDialogComponent } from '../servers/configure-gns3vm-dialog/configure-gns3vm-dialog.component';
import { AddBlankProjectDialogComponent } from './add-blank-project-dialog/add-blank-project-dialog.component';
import { ChooseNameDialogComponent } from './choose-name-dialog/choose-name-dialog.component';
import { ConfirmationBottomSheetComponent } from './confirmation-bottomsheet/confirmation-bottomsheet.component';
import { ImportProjectDialogComponent } from './import-project-dialog/import-project-dialog.component';
import { NavigationDialogComponent } from './navigation-dialog/navigation-dialog.component';

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.scss'],
})
export class ProjectsComponent implements OnInit {
  server: Server;
  projectDatabase = new ProjectDatabase();
  dataSource: ProjectDataSource;
  displayedColumns = ['name', 'actions'];
  settings: Settings;

  searchText: string = '';

  @ViewChild(MatSort, { static: true }) sort: MatSort;

  constructor(
    private route: ActivatedRoute,
    private projectService: ProjectService,
    private settingsService: SettingsService,
    private progressService: ProgressService,
    public dialog: MatDialog,
    private router: Router,
    private bottomSheet: MatBottomSheet,
    private toasterService: ToasterService,
    private electronService: ElectronService,
    private recentlyOpenedProjectService: RecentlyOpenedProjectService
  ) {}

  ngOnInit() {
    this.server = this.route.snapshot.data['server'];
    if (!this.server) this.router.navigate(['/servers']);
    this.recentlyOpenedProjectService.setServerIdProjectList(this.server.id.toString());

    this.refresh();
    this.sort.sort(<MatSortable>{
      id: 'name',
      start: 'asc',
    });
    this.dataSource = new ProjectDataSource(this.projectDatabase, this.sort);
    this.settings = this.settingsService.getAll();

    this.projectService.projectListSubject.subscribe(() => this.refresh());

    let gns3vmConfig = localStorage.getItem('gns3vmConfig');
    if (this.electronService.isElectronApp && gns3vmConfig !== 'configured') {
      const dialogRef = this.dialog.open(ConfigureGns3VMDialogComponent, {
        width: '350px',
        height: '120px',
        autoFocus: false,
        disableClose: true,
      });

      dialogRef.afterClosed().subscribe((answer: boolean) => {
        if (answer) {
          localStorage.setItem('gns3vmConfig', 'configured');
          this.router.navigate(['/server', this.server.id, 'preferences', 'gns3vm']);
        }
      });
    }
  }

  goToPreferences() {
    this.router
      .navigate(['/server', this.server.id, 'preferences'])
      .catch((error) => this.toasterService.error('Cannot navigate to the preferences'));
  }

  refresh() {
    this.projectService.list(this.server).subscribe(
      (projects: Project[]) => {
        this.projectDatabase.addProjects(projects);
      },
      (error) => {
        this.progressService.setError(error);
      }
    );
  }

  delete(project: Project) {
    this.bottomSheet.open(ConfirmationBottomSheetComponent);
    let bottomSheetRef = this.bottomSheet._openedBottomSheetRef;
    bottomSheetRef.instance.message = 'Do you want to delete the project?';
    const bottomSheetSubscription = bottomSheetRef.afterDismissed().subscribe((result: boolean) => {
      if (result) {
        this.projectService.delete(this.server, project.project_id).subscribe(() => {
          this.refresh();
        });
      }
    });
  }

  open(project: Project) {
    this.progressService.activate();

    this.projectService.open(this.server, project.project_id).subscribe(
      () => {
        this.refresh();
      },
      () => {
        this.refresh();
        this.progressService.deactivate();
        this.toasterService.error('Project was deleted.');
      },
      () => {
        this.progressService.deactivate();
      }
    );
  }

  close(project: Project) {
    this.bottomSheet.open(ConfirmationBottomSheetComponent);
    let bottomSheetRef = this.bottomSheet._openedBottomSheetRef;
    bottomSheetRef.instance.message = 'Do you want to close the project?';
    const bottomSheetSubscription = bottomSheetRef.afterDismissed().subscribe((result: boolean) => {
      if (result) {
        this.projectService.close(this.server, project.project_id).subscribe(() => {
          this.refresh();
          this.progressService.deactivate();
        });
      }
    });
  }

  duplicate(project: Project) {
    const dialogRef = this.dialog.open(ChooseNameDialogComponent, {
      width: '400px',
      autoFocus: false,
      disableClose: true,
    });
    let instance = dialogRef.componentInstance;
    instance.server = this.server;
    instance.project = project;
    dialogRef.afterClosed().subscribe(() => {
      this.refresh();
    });
  }

  addBlankProject() {
    const dialogRef = this.dialog.open(AddBlankProjectDialogComponent, {
      width: '400px',
      autoFocus: false,
      disableClose: true,
    });
    let instance = dialogRef.componentInstance;
    instance.server = this.server;
  }

  importProject() {
    let uuid: string = '';
    const dialogRef = this.dialog.open(ImportProjectDialogComponent, {
      width: '400px',
      autoFocus: false,
      disableClose: true,
    });
    let instance = dialogRef.componentInstance;
    instance.server = this.server;
    const subscription = dialogRef.componentInstance.onImportProject.subscribe((projectId: string) => {
      uuid = projectId;
    });

    dialogRef.afterClosed().subscribe(() => {
      this.refresh();
      subscription.unsubscribe();
      if (uuid) {
        this.bottomSheet.open(NavigationDialogComponent);
        let bottomSheetRef = this.bottomSheet._openedBottomSheetRef;
        bottomSheetRef.instance.projectMessage = 'imported project';

        const bottomSheetSubscription = bottomSheetRef.afterDismissed().subscribe((result: boolean) => {
          if (result) {
            this.projectService.open(this.server, uuid).subscribe(() => {
              this.router.navigate(['/server', this.server.id, 'project', uuid]);
            });
          }
        });
      }
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
  constructor(public projectDatabase: ProjectDatabase, private sort: MatSort) {
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

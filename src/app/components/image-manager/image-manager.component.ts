import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ServerService } from '../../services/server.service';
import { VersionService } from '../../services/version.service';
import { ProgressService } from 'app/common/progress/progress.service';
import { Images } from '../../models/images';
import { Server } from '../../models/server';
import { ImageManagerService } from "../../services/image-manager.service";
import { Version } from '../../models/version';
import { DataSource, SelectionModel } from '@angular/cdk/collections';
import { MatSort } from '@angular/material/sort';
import { BehaviorSubject, Observable, Subscription, merge } from 'rxjs';
import { map } from 'rxjs/operators';
import { AddImageDialogComponent } from './add-image-dialog/add-image-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { ToasterService } from '../../services/toaster.service';
import { NotificationService } from '@services/notification.service';
import { DeleteallfilesDialogComponent } from './deleteallfiles-dialog/deleteallfiles-dialog.component';

@Component({
  selector: 'app-image-manager',
  templateUrl: './image-manager.component.html',
  styleUrls: ['./image-manager.component.scss']
})
export class ImageManagerComponent implements OnInit {
  server: Server;
  public version: string;
  dataSource: imageDataSource;
  imageDatabase = new imageDatabase();
  isAllDelete: boolean = false
  selection = new SelectionModel(true, []);

  displayedColumns = ['select', 'filename', 'image_type', 'image_size', 'delete'];

  constructor(
    private imageService: ImageManagerService,
    private progressService: ProgressService,
    private route: ActivatedRoute,
    private serverService: ServerService,
    private versionService: VersionService,
    private dialog: MatDialog,
    private toasterService: ToasterService,

  ) { }

  ngOnInit(): void {
    let server_id = parseInt(this.route.snapshot.paramMap.get('server_id'));
    this.serverService.get(server_id).then((server: Server) => {
      this.server = server;
      if (server.authToken) {
        this.getImages()
      }
      this.versionService.get(this.server).subscribe((version: Version) => {
        this.version = version.version;
      });
    });
    this.dataSource = new imageDataSource(this.imageDatabase);
  }

  getImages() {
    this.imageService.getSavedImgList(this.server).subscribe(
      (images: Images[]) => {
        this.imageDatabase.addImages(images)
      },
      (error) => {
        this.progressService.setError(error);
      }
    );
  }

  deleteFile(path) {
    this.imageService.deleteImage(this.server, path).subscribe(
      (res) => {
        this.getImages()
        this.unChecked()
        this.toasterService.success('File deleted');
      },
      (error) => {
        this.toasterService.error(error)
      }
    );
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.imageDatabase.data.length;
    return numSelected === numRows;
  }

  masterToggle() {
    this.isAllSelected() ? this.unChecked() : this.allChecked()
  }

  unChecked() {
    this.selection.clear()
    this.isAllDelete = false
  }

  allChecked() {
    this.imageDatabase.data.forEach(row => this.selection.select(row))
    this.isAllDelete = true;
  }

  public addImageDialog() {
    console.log(this.server)
    const dialogRef = this.dialog.open(AddImageDialogComponent, {
      width: '750px',
      maxHeight: '550px',
      autoFocus: false,
      disableClose: true,
      data: this.server
    });

    dialogRef.afterClosed().subscribe((answer: string) => {
      if (answer) {
        this.getImages()
        this.toasterService.success('File added');
      } else {
        return false;
      }
    });
  }

  deleteAllFiles() {
    console.log(this.server)
    const dialogRef = this.dialog.open(DeleteallfilesDialogComponent, {
      width: '400px',
      maxHeight: '350px',
      autoFocus: false,
      disableClose: true,
      data: {
        server: this.server,
        deleteFilesPaths: this.imageDatabase.data
      }
    });

    dialogRef.afterClosed().subscribe((isAllfilesdeleted: boolean) => {
      if (isAllfilesdeleted) {
        this.unChecked()
        this.getImages()
        this.toasterService.success('All files deleted');
      } else {
        return false;
      }
    });

  }
}

export class imageDatabase {
  dataChange: BehaviorSubject<Images[]> = new BehaviorSubject<Images[]>([]);
  get data(): Images[] {
    return this.dataChange.value;
  }

  public addImages(fliesData: Images[]) {
    this.dataChange.next(fliesData);
  }

}

export class imageDataSource extends DataSource<Images> {
  constructor(private serverDatabase: imageDatabase) {
    super();
  }

  connect(): Observable<Images[]> {
    return merge(this.serverDatabase.dataChange).pipe(
      map(() => {
        return this.serverDatabase.data;
      })
    );
  }

  disconnect() { }
}


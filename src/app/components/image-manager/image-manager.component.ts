import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ServerService } from '../../services/server.service';
import { VersionService } from '../../services/version.service';
import { ProgressService } from 'app/common/progress/progress.service';
import { Image } from '../../models/images';
import { Server } from '../../models/server';
import { ImageManagerService } from "../../services/image-manager.service";
import { DataSource, SelectionModel } from '@angular/cdk/collections';
import { AddImageDialogComponent } from './add-image-dialog/add-image-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { ToasterService } from '../../services/toaster.service';
import { DeleteAllImageFilesDialogComponent } from './deleteallfiles-dialog/deleteallfiles-dialog.component';
import { imageDataSource, imageDatabase } from "./image-database-file";

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

  displayedColumns = ['select', 'filename', 'image_type', 'image_size','delete'];

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
      // this.versionService.get(this.server).subscribe((version: Version) => {
      //   this.version = version.version;
      // });
    });
    this.dataSource = new imageDataSource(this.imageDatabase);
  }

  getImages() {
    this.imageService.getImages(this.server).subscribe(
      (images: Image[]) => {
        this.imageDatabase.addImages(images)
      },
      (error) => {
        this.toasterService.error(error.error.message)
      
      }
    );
  }

  deleteFile(path) {
    this.imageService.deleteFile(this.server, path).subscribe(
      (res) => {
        this.getImages()
        this.unChecked()
        this.toasterService.success('File deleted');
      },
      (error) => {
        this.getImages()
        this.unChecked()
        this.toasterService.error(error.error.message)
      }
    );
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.imageDatabase.data.length;
    return numSelected === numRows;
  }

  selectAllImages() {
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
    const dialogRef = this.dialog.open(AddImageDialogComponent, {
      width: '600px',
      maxHeight: '550px',
      autoFocus: false,
      disableClose: true,
      data: this.server
    });

    dialogRef.afterClosed().subscribe((isAddes: boolean) => {
      if (isAddes) {
        this.getImages()
        this.unChecked()
      } else {
        this.getImages()
        this.unChecked()
        return false;
      }
    });
  }

  deleteAllFiles() {
    const dialogRef = this.dialog.open(DeleteAllImageFilesDialogComponent, {
      width: '500px',
      maxHeight: '650px',
      autoFocus: false,
      disableClose: true,
      data: {
        server: this.server,
        deleteFilesPaths: this.selection.selected
      }
    });

    dialogRef.afterClosed().subscribe((isAllfilesdeleted: boolean) => {
      if (isAllfilesdeleted) {
        this.unChecked()
        this.getImages()
        this.toasterService.success('All files deleted');
      } else {
        this.unChecked()
        this.getImages()
        return false;
      }
    });
  }
}

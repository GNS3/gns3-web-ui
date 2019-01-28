import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Server } from '../../../models/server';


@Component({
    selector: 'app-add-server-dialog',
    templateUrl: 'add-server-dialog.component.html'
  })
  export class AddServerDialogComponent implements OnInit {
    server: Server = new Server();
  
    authorizations = [{ key: 'none', name: 'No authorization' }, { key: 'basic', name: 'Basic authorization' }];
  
    constructor(public dialogRef: MatDialogRef<AddServerDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: any) {}
  
    ngOnInit() {
      this.server.authorization = 'none';
    }
  
    onAddClick(): void {
      this.dialogRef.close(this.server);
    }
  
    onNoClick(): void {
      this.dialogRef.close();
    }
}

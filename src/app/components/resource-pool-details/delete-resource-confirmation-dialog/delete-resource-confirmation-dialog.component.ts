import {Component, Inject, OnInit} from '@angular/core';
import {DIALOG_DATA} from "@angular/cdk/dialog";
import {Resource} from "@models/resourcePools/Resource";
import {MatDialogRef} from "@angular/material/dialog";

@Component({
  selector: 'app-delete-resource-confirmation-dialog',
  templateUrl: './delete-resource-confirmation-dialog.component.html',
  styleUrls: ['./delete-resource-confirmation-dialog.component.scss']
})
export class DeleteResourceConfirmationDialogComponent implements OnInit {

  constructor(@Inject(DIALOG_DATA) public data: Resource,
              public dialogRef: MatDialogRef<DeleteResourceConfirmationDialogComponent>,) { }

  ngOnInit(): void {
  }

}

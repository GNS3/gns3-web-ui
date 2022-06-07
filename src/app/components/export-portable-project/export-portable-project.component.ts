import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-export-portable-project',
  templateUrl: './export-portable-project.component.html',
  styleUrls: ['./export-portable-project.component.scss']
})
export class ExportPortableProjectComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<ExportPortableProjectComponent>,

  ) { }

  ngOnInit(): void {
  }

}

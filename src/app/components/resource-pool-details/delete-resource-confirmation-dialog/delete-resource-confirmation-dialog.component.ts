import { ChangeDetectionStrategy, Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DIALOG_DATA } from '@angular/cdk/dialog';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { Resource } from '@models/resourcePools/Resource';

@Component({
  standalone: true,
  selector: 'app-delete-resource-confirmation-dialog',
  templateUrl: './delete-resource-confirmation-dialog.component.html',
  styleUrls: ['./delete-resource-confirmation-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
})
export class DeleteResourceConfirmationDialogComponent implements OnInit {
  public dialogRef = inject(MatDialogRef<DeleteResourceConfirmationDialogComponent>);

  constructor(@Inject(DIALOG_DATA) public data: Resource) {}

  ngOnInit(): void {}
}

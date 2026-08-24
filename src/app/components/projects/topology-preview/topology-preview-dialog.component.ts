import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Controller } from '@models/controller';
import { Project } from '@models/project';
import { TopologyPreviewData } from '@services/gns3-file.mapper';
import { TopologyPreviewComponent } from './topology-preview.component';

export interface TopologyPreviewDialogData {
  controller: Controller;
  project: Project;
  topology: TopologyPreviewData;
}

/**
 * Enlarged (70vw × 70vh, via .topology-preview-dialog-panel) static topology
 * preview. The data arrives pre-resolved from the caller's cache — this
 * dialog never fetches.
 */
@Component({
  selector: 'app-topology-preview-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, TopologyPreviewComponent],
  templateUrl: './topology-preview-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopologyPreviewDialogComponent {
  readonly dialogRef = inject(MatDialogRef<TopologyPreviewDialogComponent>);
  readonly data = inject<TopologyPreviewDialogData>(MAT_DIALOG_DATA);
}

import { ChangeDetectionStrategy, Component, inject, model } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

/**
 * Collects the image reference to pull from a registry. The pull itself runs
 * in the Image Manager so its progress/error feedback stays on the page.
 */
@Component({
  selector: 'app-docker-image-pull-dialog',
  templateUrl: './docker-image-pull-dialog.component.html',
  styleUrl: './docker-image-pull-dialog.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
})
export class DockerImagePullDialogComponent {
  private dialogRef = inject(MatDialogRef<DockerImagePullDialogComponent>);

  readonly imageName = model('');

  pull(): void {
    const image = this.imageName().trim();
    if (!image) {
      return;
    }
    this.dialogRef.close(image);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}

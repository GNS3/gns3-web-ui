import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { MissingImagesDialogService } from '@components/projects/missing-images-dialog/missing-images-dialog.service';
import { ToasterService } from '@services/toaster.service';

@Component({
  selector: 'app-fix-missing-image-action',
  templateUrl: './fix-missing-image-action.component.html',
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FixMissingImageActionComponent {
  private missingImagesDialog = inject(MissingImagesDialogService);
  private toasterService = inject(ToasterService);

  readonly controller = input<Controller>(undefined);
  readonly node = input<Node>(undefined);

  fixMissingImage() {
    this.missingImagesDialog
      .open(this.controller(), [this.node()], {
        title: 'Node missing image',
        introText:
          'This node references an image that is not available. Select a compatible replacement image for this node. ' +
          'Nodes without a compatible image are kept in a degraded state and cannot be started.',
        dismissButtonText: 'Cancel',
        contentSized: true,
      })
      .subscribe((result) => {
        if (!result || result.updated === 0) {
          return;
        }
        this.toasterService.success(`Image updated for ${this.node().name}.`);
        if (result.remaining > 0) {
          this.toasterService.warning('Some images are still missing - the affected nodes cannot be started.');
        }
      });
  }
}

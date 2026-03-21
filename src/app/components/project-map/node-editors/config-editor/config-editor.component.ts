import { ChangeDetectionStrategy, Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Node } from '../../../../cartography/models/node';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';

@Component({
  standalone: true,
  selector: 'app-config-editor',
  templateUrl: './config-editor.component.html',
  styleUrls: ['./config-editor.component.scss'],
  imports: [MatDialogModule, MatButtonModule, MatProgressSpinnerModule],
  // TODO: This component has been partially migrated to be zoneless-compatible.
  // After testing, this should be updated to ChangeDetectionStrategy.OnPush.
  changeDetection: ChangeDetectionStrategy.Default,
})
export class ConfigEditorDialogComponent implements OnInit {
  public dialogRef = inject(MatDialogRef<ConfigEditorDialogComponent>);
  public nodeService = inject(NodeService);
  private toasterService = inject(ToasterService);
  private cdr = inject(ChangeDetectorRef);

  controller: Controller;
  project: Project;
  node: Node;

  config: any;
  privateConfig: any;

  ngOnInit() {
    this.nodeService.getStartupConfiguration(this.controller, this.node).subscribe((config: any) => {
      this.config = config;
      this.cdr.markForCheck();
    });

    if (this.node.node_type === 'iou' || this.node.node_type === 'dynamips') {
      this.nodeService.getPrivateConfiguration(this.controller, this.node).subscribe((privateConfig: any) => {
        this.privateConfig = privateConfig;
        this.cdr.markForCheck();
      });
    }
  }

  onSaveClick() {
    this.nodeService.saveConfiguration(this.controller, this.node, this.config).subscribe((response) => {
      if (this.node.node_type === 'iou' || this.node.node_type === 'dynamips') {
        this.nodeService.savePrivateConfiguration(this.controller, this.node, this.privateConfig).subscribe((resp) => {
          this.dialogRef.close();
          this.toasterService.success(`Configuration for node ${this.node.name} saved.`);
        });
      } else {
        this.dialogRef.close();
        this.toasterService.success(`Configuration for node ${this.node.name} saved.`);
      }
    });
  }

  onCancelClick() {
    this.dialogRef.close();
  }
}

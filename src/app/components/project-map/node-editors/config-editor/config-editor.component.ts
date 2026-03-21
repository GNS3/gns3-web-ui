import { Component, OnInit, inject } from '@angular/core';
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
})
export class ConfigEditorDialogComponent implements OnInit {
  public dialogRef = inject(MatDialogRef<ConfigEditorDialogComponent>);
  public nodeService = inject(NodeService);
  private toasterService = inject(ToasterService);

  controller: Controller;
  project: Project;
  node: Node;

  config: any;
  privateConfig: any;

  ngOnInit() {
    this.nodeService.getStartupConfiguration(this.controller, this.node).subscribe((config: any) => {
      this.config = config;
    });

    if (this.node.node_type === 'iou' || this.node.node_type === 'dynamips') {
      this.nodeService.getPrivateConfiguration(this.controller, this.node).subscribe((privateConfig: any) => {
        this.privateConfig = privateConfig;
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

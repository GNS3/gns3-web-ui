import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Node } from '../../../../cartography/models/node';
import { Project } from '../../../../models/project';
import { Server } from '../../../../models/server';
import { NodeService } from '../../../../services/node.service';
import { ToasterService } from '../../../../services/toaster.service';

@Component({
  selector: 'app-config-editor',
  templateUrl: './config-editor.component.html',
  styleUrls: ['./config-editor.component.scss'],
})
export class ConfigEditorDialogComponent implements OnInit {
  controller: Server;
  project: Project;
  node: Node;

  config: any;
  privateConfig: any;

  constructor(
    public dialogRef: MatDialogRef<ConfigEditorDialogComponent>,
    public nodeService: NodeService,
    private toasterService: ToasterService
  ) {}

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

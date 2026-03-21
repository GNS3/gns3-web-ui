import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, UntypedFormBuilder } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Node } from '../../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { DockerConfigurationService } from '@services/docker-configuration.service';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';

@Component({
  standalone: true,
  selector: 'app-configure-custom-adapters',
  templateUrl: './configure-custom-adapters.component.html',
  styleUrls: ['./configure-custom-adapters.component.scss'],
  imports: [CommonModule, FormsModule, MatDialogModule, MatListModule, MatInputModule, MatButtonModule],
  // TODO: This component has been partially migrated to be zoneless-compatible.
  // After testing, this should be updated to ChangeDetectionStrategy.OnPush.
  changeDetection: ChangeDetectionStrategy.Default,
})
export class ConfigureCustomAdaptersDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<ConfigureCustomAdaptersDialogComponent>);
  private nodeService = inject(NodeService);
  private toasterService = inject(ToasterService);
  private formBuilder = inject(UntypedFormBuilder);
  private dockerConfigurationService = inject(DockerConfigurationService);

  controller: Controller;
  node: Node;
  displayedColumns: string[] = ['adapter_number', 'port_name'];
  adapters: CustomAdapter[] = [];

  constructor() {}

  ngOnInit() {
    let i: number = 0;
    if (!this.node.custom_adapters) {
      this.node.ports.forEach((port) => {
        this.adapters.push({
          adapter_number: i,
          port_name: '',
        });
      });
    } else {
      this.adapters = this.node.custom_adapters;
    }
  }

  onSaveClick() {
    this.node.custom_adapters = this.adapters;
    this.nodeService.updateNodeWithCustomAdapters(this.controller, this.node).subscribe(() => {
      this.onCancelClick();
      this.toasterService.success(`Configuration saved for node ${this.node.name}`);
    });
  }

  onCancelClick() {
    this.dialogRef.close();
  }
}

export class CustomAdapter {
  adapter_number: number;
  port_name: string;
}

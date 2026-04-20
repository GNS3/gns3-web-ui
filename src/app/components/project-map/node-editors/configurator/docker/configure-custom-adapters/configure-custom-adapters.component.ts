import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject, model } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  selector: 'app-configure-custom-adapters',
  templateUrl: './configure-custom-adapters.component.html',
  styleUrl: './configure-custom-adapters.component.scss',
  imports: [CommonModule, MatDialogModule, MatListModule, MatInputModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfigureCustomAdaptersDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<ConfigureCustomAdaptersDialogComponent>);
  private nodeService = inject(NodeService);
  private toasterService = inject(ToasterService);
  private dockerConfigurationService = inject(DockerConfigurationService);
  private cdr = inject(ChangeDetectorRef);

  controller: Controller;
  node: Node;
  displayedColumns: string[] = ['adapter_number', 'port_name'];
  readonly adapters = model<CustomAdapter[]>([]);

  constructor() {}

  ngOnInit() {
    let i: number = 0;
    const currentAdapters: CustomAdapter[] = [];
    if (!this.node.custom_adapters) {
      this.node.ports.forEach((port) => {
        currentAdapters.push({
          adapter_number: i,
          port_name: '',
        });
        i++;
      });
    } else {
      currentAdapters.push(...this.node.custom_adapters);
    }
    this.adapters.set(currentAdapters);
  }

  onPortNameChange(adapterNumber: number, value: string) {
    this.adapters.update((adapters) =>
      adapters.map((a) => (a.adapter_number === adapterNumber ? { ...a, port_name: value } : a))
    );
    this.cdr.markForCheck();
  }

  onSaveClick() {
    this.node.custom_adapters = this.adapters();
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

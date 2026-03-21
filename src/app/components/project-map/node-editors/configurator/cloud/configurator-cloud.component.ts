import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule, MatChipInputEvent } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Node } from '../../../../../cartography/models/node';
import { UdpTunnelsComponent } from '@components/preferences/common/udp-tunnels/udp-tunnels.component';
import { PortsMappingEntity } from '@models/ethernetHub/ports-mapping-enity';
import { QemuBinary } from '@models/qemu/qemu-binary';
import { Controller } from '@models/controller';
import { BuiltInTemplatesConfigurationService } from '@services/built-in-templates-configuration.service';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';

@Component({
  standalone: true,
  selector: 'app-configurator-cloud',
  templateUrl: './configurator-cloud.component.html',
  styleUrls: ['../configurator.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatDialogModule, MatCardModule, MatTabsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatChipsModule, MatIconModule, UdpTunnelsComponent]
})
export class ConfiguratorDialogCloudComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<ConfiguratorDialogCloudComponent>);
  private nodeService = inject(NodeService);
  private toasterService = inject(ToasterService);
  private formBuilder = inject(UntypedFormBuilder);
  private builtInTemplatesConfigurationService = inject(BuiltInTemplatesConfigurationService);
  private cd = inject(ChangeDetectorRef);

  controller: Controller;
  node: Node;
  name: string;
  generalSettingsForm: UntypedFormGroup;
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];
  consoleTypes: string[] = [];
  onCloseOptions = [];
  bootPriorities = [];
  diskInterfaces: string[] = [];

  portsMappingEthernet: PortsMappingEntity[] = [];
  portsMappingTap: PortsMappingEntity[] = [];
  portsMappingUdp: PortsMappingEntity[] = [];

  displayedColumns: string[] = ['adapter_number', 'port_name', 'adapter_type', 'actions'];
  networkTypes = [];
  tapInterface: string = '';
  ethernetInterface: string = '';
  ethernetInterfaces: string[] = ['Ethernet 2', 'Ethernet 3'];

  @ViewChild('udpTunnels') udpTunnels: UdpTunnelsComponent;

  constructor() {
    this.generalSettingsForm = this.formBuilder.group({
      name: new UntypedFormControl('', Validators.required),
    });
  }

  ngOnInit() {
    this.nodeService.getNode(this.controller, this.node).subscribe((node: Node) => {
      this.node = node;
      this.name = node.name;
      this.getConfiguration();

      if (!this.node.tags) {
        this.node.tags = [];
      }

      this.portsMappingEthernet = this.node.properties.ports_mapping.filter((elem) => elem.type === 'ethernet');

      this.portsMappingTap = this.node.properties.ports_mapping.filter((elem) => elem.type === 'tap');

      this.portsMappingUdp = this.node.properties.ports_mapping.filter((elem) => elem.type === 'udp');
      this.cd.markForCheck();
    });
  }

  getConfiguration() {
    this.consoleTypes = this.builtInTemplatesConfigurationService.getConsoleTypesForCloudNodes();
  }

  onAddEthernetInterface() {
    if (this.ethernetInterface) {
      this.portsMappingEthernet.push({
        interface: this.ethernetInterface,
        name: this.ethernetInterface,
        port_number: 0,
        type: 'ethernet',
      });
    }
  }

  onAddTapInterface() {
    if (this.tapInterface) {
      this.portsMappingTap.push({
        interface: this.tapInterface,
        name: this.tapInterface,
        port_number: 0,
        type: 'tap',
      });
    }
  }

  onSaveClick() {
    if (this.generalSettingsForm.valid) {
      this.portsMappingUdp = this.udpTunnels.dataSourceUdp;

      this.node.properties.ports_mapping = this.portsMappingUdp
        .concat(this.portsMappingEthernet)
        .concat(this.portsMappingTap);

      this.nodeService.updateNode(this.controller, this.node).subscribe(() => {
        this.toasterService.success(`Node ${this.node.name} updated.`);
        this.onCancelClick();
      });
    } else {
      this.toasterService.error(`Fill all required fields.`);
    }
  }

  onCancelClick() {
    this.dialogRef.close();
  }

  addTag(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();

    if (value && this.node) {
      if (!this.node.tags) {
        this.node.tags = [];
      }
      this.node.tags.push(value);
    }

    // Clear the input value
    if (event.chipInput) {
      event.chipInput.clear();
    }
  }

  removeTag(tag: string): void {
    if (!this.node.tags) {
      return;
    }
    const index = this.node.tags.indexOf(tag);

    if (index >= 0) {
      this.node.tags.splice(index, 1);
    }
  }
}

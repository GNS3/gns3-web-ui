import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject, model, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
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
  // Styles centralized in src/styles/_dialogs.scss via panelClass: 'configurator-dialog-panel'
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatCardModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    UdpTunnelsComponent,
  ],
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
  readonly tapInterface = model('');
  readonly ethernetInterface = model('');
  ethernetInterfaces: string[] = ['Ethernet 2', 'Ethernet 3'];

  readonly udpTunnels = viewChild<UdpTunnelsComponent>('udpTunnels');

  constructor() {
    this.generalSettingsForm = this.formBuilder.group({
      name: new UntypedFormControl('', Validators.required),
      console_type: new UntypedFormControl(''),
      remote_console_host: new UntypedFormControl(''),
      remote_console_port: new UntypedFormControl(''),
      remote_console_http_path: new UntypedFormControl(''),
      usage: new UntypedFormControl(''),
    });
  }

  ngOnInit() {
    this.nodeService.getNode(this.controller, this.node).subscribe((node: Node) => {
      this.node = node;
      this.name = node.name;

      // Update form values with node data
      this.generalSettingsForm.patchValue({
        name: node.name,
        console_type: node.console_type || '',
        remote_console_host: node.properties.remote_console_host || '',
        remote_console_port: node.properties.remote_console_port || '',
        remote_console_http_path: node.properties.remote_console_http_path || '',
        usage: node.properties.usage || '',
      });

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
    if (this.ethernetInterface()) {
      this.portsMappingEthernet.push({
        interface: this.ethernetInterface(),
        name: this.ethernetInterface(),
        port_number: 0,
        type: 'ethernet',
      });
    }
  }

  onAddTapInterface() {
    if (this.tapInterface()) {
      this.portsMappingTap.push({
        interface: this.tapInterface(),
        name: this.tapInterface(),
        port_number: 0,
        type: 'tap',
      });
    }
  }

  onSaveClick() {
    if (this.generalSettingsForm.valid) {
      // Merge form values back into node
      const formValues = this.generalSettingsForm.value;

      this.node.name = formValues.name;
      this.node.console_type = formValues.console_type;
      this.node.properties.remote_console_host = formValues.remote_console_host;
      this.node.properties.remote_console_port = formValues.remote_console_port;
      this.node.properties.remote_console_http_path = formValues.remote_console_http_path;
      this.node.properties.usage = formValues.usage;

      this.portsMappingUdp = this.udpTunnels().dataSourceUdp;

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

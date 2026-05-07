import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject, model, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule, MatChipInputEvent } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Node } from '../../../../../cartography/models/node';
import { UdpTunnelsComponent } from '@components/preferences/common/udp-tunnels/udp-tunnels.component';
import { PortsMappingEntity } from '@models/ethernetHub/ports-mapping-enity';
import { QemuBinary } from '@models/qemu/qemu-binary';
import { Controller } from '@models/controller';
import { BuiltInTemplatesConfigurationService } from '@services/built-in-templates-configuration.service';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';
import { CloudValidationService } from '@services/validation';

@Component({
  standalone: true,
  selector: 'app-configurator-cloud',
  templateUrl: './configurator-cloud.component.html',
  // Styles centralized in src/styles/_dialogs.scss via panelClass: 'configurator-dialog-panel'
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatCardModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatTableModule,
    MatTooltipModule,
    UdpTunnelsComponent,
  ],
})
export class ConfiguratorDialogCloudComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<ConfiguratorDialogCloudComponent>);
  private nodeService = inject(NodeService);
  private toasterService = inject(ToasterService);
  private builtInTemplatesConfigurationService = inject(BuiltInTemplatesConfigurationService);
  private cd = inject(ChangeDetectorRef);
  private validationService = inject(CloudValidationService);

  controller: Controller;
  node: Node;
  name: string;
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];
  consoleTypes: string[] = [];
  onCloseOptions = [];
  bootPriorities = [];
  diskInterfaces: string[] = [];

  portsMappingEthernet: PortsMappingEntity[] = [];
  portsMappingTap: PortsMappingEntity[] = [];
  portsMappingUdp: PortsMappingEntity[] = [];

  ethernetDisplayColumns: string[] = ['name', 'actions'];
  tapDisplayColumns: string[] = ['name', 'actions'];
  displayedColumns: string[] = ['adapter_number', 'port_name', 'adapter_type', 'actions'];
  networkTypes = [];
  readonly tapInterface = model('');
  readonly ethernetInterface = model('');
  availableEthernetInterfaces: string[] = [];

  // Model signals for form fields
  readonly nodeName = model('');
  readonly consoleType = model('none');
  readonly remoteConsoleHost = model('');
  readonly remoteConsolePort = model('');
  readonly remoteConsoleHttpPath = model('');
  readonly usage = model('');

  readonly udpTunnels = viewChild<UdpTunnelsComponent>('udpTunnels');

  ngOnInit() {
    this.nodeService.getNode(this.controller, this.node).subscribe({
      next: (node: Node) => {
        this.node = node;
        this.name = node.name;

        // Update model signals with node data
        this.nodeName.set(node.name || '');
        this.consoleType.set(node.console_type || 'none');
        this.remoteConsoleHost.set(node.properties.remote_console_host || '');
        this.remoteConsolePort.set(node.properties.remote_console_port?.toString() || '');
        this.remoteConsoleHttpPath.set(node.properties.remote_console_http_path || '');
        this.usage.set(node.properties.usage || '');

        this.getConfiguration();

        if (!this.node.tags) {
          this.node.tags = [];
        }

        // Populate available ethernet interfaces from gns3server
        if (this.node.properties.interfaces) {
          this.availableEthernetInterfaces = this.node.properties.interfaces
            .filter((iface) => iface.type === 'ethernet')
            .map((iface) => iface.name);
        }

        this.portsMappingEthernet = this.node.properties.ports_mapping.filter((elem) => elem.type === 'ethernet');

        this.portsMappingTap = this.node.properties.ports_mapping.filter((elem) => elem.type === 'tap');

        this.portsMappingUdp = this.node.properties.ports_mapping.filter((elem) => elem.type === 'udp');

        this.cd.markForCheck();
      },
      error: (err) => {
        const message = err.error?.message || err.message || 'Failed to load node';
        this.toasterService.error(message);
        this.cd.markForCheck();
      },
    });
  }

  getConfiguration() {
    this.consoleTypes = this.builtInTemplatesConfigurationService.getConsoleTypesForCloudNodes();
  }

  onAddEthernetInterface() {
    if (this.ethernetInterface()) {
      // Validate interface name
      const nameValidation = this.validationService.validateInterfaceName(this.ethernetInterface());
      if (!nameValidation.isValid) {
        this.toasterService.error(nameValidation.errorMessage || 'Invalid interface name');
        return;
      }

      // Check if interface already exists
      const existingNames = this.portsMappingEthernet.map((port) => port.name);
      const uniqueValidation = this.validationService.validateUniqueInterface(this.ethernetInterface(), existingNames);
      if (!uniqueValidation.isValid) {
        this.toasterService.error(uniqueValidation.errorMessage || `Interface ${this.ethernetInterface()} already configured.`);
        return;
      }

      this.portsMappingEthernet.push({
        interface: this.ethernetInterface(),
        name: this.ethernetInterface(),
        port_number: 0,
        type: 'ethernet',
      });
      // Force array refresh for change detection
      this.portsMappingEthernet = [...this.portsMappingEthernet];
      this.ethernetInterface.set('');
      this.cd.markForCheck();
    }
  }

  onDeleteEthernetInterface(port: PortsMappingEntity) {
    this.portsMappingEthernet = this.portsMappingEthernet.filter((p) => p !== port);
    this.cd.markForCheck();
  }

  onAddTapInterface() {
    if (this.tapInterface()) {
      // Validate interface name
      const nameValidation = this.validationService.validateInterfaceName(this.tapInterface());
      if (!nameValidation.isValid) {
        this.toasterService.error(nameValidation.errorMessage || 'Invalid interface name');
        return;
      }

      // Check if interface already exists
      const existingNames = this.portsMappingTap.map((port) => port.name);
      const uniqueValidation = this.validationService.validateUniqueInterface(this.tapInterface(), existingNames);
      if (!uniqueValidation.isValid) {
        this.toasterService.error(uniqueValidation.errorMessage || `Interface ${this.tapInterface()} already configured.`);
        return;
      }

      this.portsMappingTap.push({
        interface: this.tapInterface(),
        name: this.tapInterface(),
        port_number: 0,
        type: 'tap',
      });
      // Force array refresh for change detection
      this.portsMappingTap = [...this.portsMappingTap];
      this.tapInterface.set('');
      this.cd.markForCheck();
    }
  }

  onDeleteTapInterface(port: PortsMappingEntity) {
    this.portsMappingTap = this.portsMappingTap.filter((p) => p !== port);
    this.cd.markForCheck();
  }

  onSaveClick() {
    // Validate required fields
    const nameValidation = this.validationService.validateName(this.nodeName());
    if (!nameValidation.isValid) {
      this.toasterService.error(nameValidation.errorMessage || 'Name is required');
      return;
    }

    // Validate remote console port if provided
    if (this.remoteConsolePort()) {
      const portValidation = this.validationService.validateRemoteConsolePort(this.remoteConsolePort());
      if (!portValidation.isValid) {
        this.toasterService.error(portValidation.errorMessage || 'Remote console port must be between 1 and 65535');
        return;
      }
    }

    // Validate console type
    const consoleTypeValidation = this.validationService.validateConsoleType(
      this.consoleType(),
      this.consoleTypes
    );
    if (!consoleTypeValidation.isValid) {
      this.toasterService.error(consoleTypeValidation.errorMessage || 'Invalid console type');
      return;
    }

    // Validate remote console host if provided
    if (this.remoteConsoleHost()) {
      const hostValidation = this.validationService.validateRemoteConsoleHost(this.remoteConsoleHost());
      if (!hostValidation.isValid) {
        this.toasterService.error(hostValidation.errorMessage || 'Invalid remote console host');
        return;
      }
    }

    // Validate HTTP path if provided
    if (this.remoteConsoleHttpPath()) {
      const pathValidation = this.validationService.validateRemoteConsoleHttpPath(this.remoteConsoleHttpPath());
      if (!pathValidation.isValid) {
        this.toasterService.error(pathValidation.errorMessage || 'Invalid HTTP path');
        return;
      }
    }

    // Merge model signal values back into node
    this.node.name = this.nodeName();
    // Ensure console_type is never empty - use 'none' as default
    this.node.console_type = this.consoleType() || 'none';
    this.node.properties.remote_console_host = this.remoteConsoleHost();
    this.node.properties.remote_console_port = this.remoteConsolePort() ? parseInt(this.remoteConsolePort(), 10) : undefined;
    this.node.properties.remote_console_http_path = this.remoteConsoleHttpPath();
    this.node.properties.usage = this.usage();

    this.portsMappingUdp = this.udpTunnels().dataSourceUdp;

    this.node.properties.ports_mapping = this.portsMappingUdp
      .concat(this.portsMappingEthernet)
      .concat(this.portsMappingTap);

    this.nodeService.updateNode(this.controller, this.node).subscribe({
      next: () => {
        this.toasterService.success(`Node ${this.node.name} updated.`);
        this.onCancelClick();
      },
      error: (error: unknown) => {
        const errorMessage = (error as any)?.error?.message || (error as any)?.message || 'Failed to update node';
        this.toasterService.error(errorMessage);
        this.cd.markForCheck();
      },
    });
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

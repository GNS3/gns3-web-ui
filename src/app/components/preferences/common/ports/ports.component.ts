import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  inject,
  model,
  signal,
} from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatOptionModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { PortsMappingEntity } from '@models/ethernetHub/ports-mapping-enity';
import { BuiltInTemplatesConfigurationService } from '@services/built-in-templates-configuration.service';
import { ToasterService } from '@services/toaster.service';

@Component({
  selector: 'app-ports',
  standalone: true,
  templateUrl: './ports.component.html',
  styleUrls: ['./ports.component.scss'],
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    MatOptionModule,
    MatCheckboxModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortsComponent implements OnInit, OnChanges {
  @Input() ethernetPorts: PortsMappingEntity[] = [];
  @Output() readonly ethernetPortsChange = new EventEmitter<PortsMappingEntity[]>();

  private static readonly defaultEthertype = '0x8100';
  private static readonly qinqPortType = 'qinq';

  readonly newPortNumber = model<number>(0);
  readonly newPortVlan = model<number>(1);
  readonly newPortType = model<string>('access');
  readonly newPortEthertype = model<string>(PortsComponent.defaultEthertype);
  readonly newPortCount = model<number>(1);
  readonly bulkVlan = model<number | null>(null);
  readonly bulkType = model<string>('');
  readonly bulkEthertype = model<string>('');

  private builtInTemplatesConfigurationService = inject(BuiltInTemplatesConfigurationService);
  private toasterService = inject(ToasterService);

  readonly portTypes = signal<string[]>([]);
  readonly etherTypes = signal<string[]>([]);
  readonly selectedPorts = new Set<PortsMappingEntity>();
  displayedColumns: string[] = ['select', 'port_number', 'vlan', 'type', 'ethertype', 'action'];

  ngOnInit() {
    this.getConfiguration();
    this.setNextPortNumber();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!changes['ethernetPorts']) {
      return;
    }

    this.removeStaleSelections();
    this.setNextPortNumber();
  }

  getConfiguration() {
    this.etherTypes.set(this.builtInTemplatesConfigurationService.getEtherTypesForEthernetSwitches());
    this.portTypes.set(this.builtInTemplatesConfigurationService.getPortTypesForEthernetSwitches());
  }

  onAdd() {
    const startPort = this.newPortNumber();
    const count = this.newPortCount();

    if (!Number.isInteger(startPort) || startPort < 0) {
      this.toasterService.error('Port number must be a non-negative integer.');
      return;
    }
    if (!Number.isInteger(count) || count < 1) {
      this.toasterService.error('Number of ports must be at least 1.');
      return;
    }
    if (!this.isValidVlan(this.newPortVlan())) {
      this.toasterService.error('VLAN must be between 1 and 4094.');
      return;
    }

    const requestedPortNumbers = Array.from({ length: count }, (_, index) => startPort + index);
    const duplicatePort = requestedPortNumbers.find((portNumber) =>
      this.ethernetPorts.some((port) => port.port_number === portNumber)
    );
    if (duplicatePort !== undefined) {
      this.toasterService.error(`Port number ${duplicatePort} already exists.`);
      return;
    }

    const ethertype = this.newPortEthertype();
    const portType = ethertype === PortsComponent.defaultEthertype ? this.newPortType() : PortsComponent.qinqPortType;
    const ports = requestedPortNumbers.map(
      (portNumber): PortsMappingEntity => ({
        name: `Ethernet${portNumber}`,
        port_number: portNumber,
        vlan: this.newPortVlan(),
        type: portType,
        ethertype,
      })
    );
    this.setPorts([...this.ethernetPorts, ...ports].sort((a, b) => a.port_number - b.port_number));
    this.setNextPortNumber();
  }

  delete(port: PortsMappingEntity) {
    this.selectedPorts.delete(port);
    this.setPorts(this.ethernetPorts.filter((n) => n !== port));
    this.setNextPortNumber();
  }

  togglePort(port: PortsMappingEntity, selected: boolean) {
    selected ? this.selectedPorts.add(port) : this.selectedPorts.delete(port);
  }

  toggleAll(selected: boolean) {
    this.selectedPorts.clear();
    if (selected) {
      this.ethernetPorts.forEach((port) => this.selectedPorts.add(port));
    }
  }

  allPortsSelected() {
    return this.ethernetPorts.length > 0 && this.selectedPorts.size === this.ethernetPorts.length;
  }

  somePortsSelected() {
    return this.selectedPorts.size > 0 && !this.allPortsSelected();
  }

  updateBulkType(type: string) {
    this.bulkType.set(type);
    if (type && type !== PortsComponent.qinqPortType && this.bulkEthertype() !== PortsComponent.defaultEthertype) {
      this.bulkEthertype.set('');
    }
  }

  updateBulkEthertype(ethertype: string) {
    this.bulkEthertype.set(ethertype);
    if (ethertype && ethertype !== PortsComponent.defaultEthertype) {
      this.bulkType.set(PortsComponent.qinqPortType);
    }
  }

  applyBulkChanges() {
    if (!this.selectedPorts.size) {
      this.toasterService.error('Select at least one port to update.');
      return;
    }
    if (this.bulkVlan() === null && !this.bulkType() && !this.bulkEthertype()) {
      this.toasterService.error('Choose at least one value to update.');
      return;
    }
    const vlan = this.bulkVlan();
    if (vlan !== null && !this.isValidVlan(vlan)) {
      this.toasterService.error('VLAN must be between 1 and 4094.');
      return;
    }

    this.selectedPorts.forEach((port) => {
      if (vlan !== null) {
        port.vlan = vlan;
      }
      if (this.bulkType()) {
        port.type = this.bulkType();
      }
      if (this.bulkEthertype()) {
        port.ethertype = this.bulkEthertype();
        if (port.ethertype !== PortsComponent.defaultEthertype) {
          port.type = PortsComponent.qinqPortType;
        }
      }
      if (port.type !== PortsComponent.qinqPortType) {
        port.ethertype = PortsComponent.defaultEthertype;
      }
    });
    this.setPorts([...this.ethernetPorts]);
  }

  updateVlan(port: PortsMappingEntity, vlan: number, input?: HTMLInputElement) {
    if (!this.isValidVlan(vlan)) {
      this.toasterService.error('VLAN must be between 1 and 4094.');
      if (input) {
        input.value = port.vlan?.toString() ?? '';
      }
      return;
    }
    port.vlan = vlan;
    this.emitPortsChange();
  }

  updatePortType(port: PortsMappingEntity, type: string) {
    port.type = type;
    if (type !== PortsComponent.qinqPortType) {
      port.ethertype = PortsComponent.defaultEthertype;
    }
    this.emitPortsChange();
  }

  updatePortEthertype(port: PortsMappingEntity, ethertype: string) {
    port.ethertype = ethertype;
    if (ethertype !== PortsComponent.defaultEthertype) {
      port.type = PortsComponent.qinqPortType;
    }
    this.emitPortsChange();
  }

  updateNewPortType(type: string) {
    this.newPortType.set(type);
    if (type !== PortsComponent.qinqPortType) {
      this.newPortEthertype.set(PortsComponent.defaultEthertype);
    }
  }

  updateNewPortEthertype(ethertype: string) {
    this.newPortEthertype.set(ethertype);
    if (ethertype !== PortsComponent.defaultEthertype) {
      this.newPortType.set(PortsComponent.qinqPortType);
    }
  }

  private isValidVlan(vlan: number): boolean {
    return Number.isInteger(vlan) && vlan >= 1 && vlan <= 4094;
  }

  private setNextPortNumber() {
    const usedPortNumbers = new Set(this.ethernetPorts.map((port) => port.port_number));
    let nextPortNumber = 0;
    while (usedPortNumbers.has(nextPortNumber)) {
      nextPortNumber++;
    }
    this.newPortNumber.set(nextPortNumber);
  }

  private removeStaleSelections() {
    const currentPorts = new Set(this.ethernetPorts);
    this.selectedPorts.forEach((port) => {
      if (!currentPorts.has(port)) {
        this.selectedPorts.delete(port);
      }
    });
  }

  private setPorts(ports: PortsMappingEntity[]) {
    this.ethernetPorts = ports;
    this.emitPortsChange();
  }

  private emitPortsChange() {
    this.ethernetPortsChange.emit(this.ethernetPorts);
  }
}

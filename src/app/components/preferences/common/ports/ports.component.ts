import { ChangeDetectionStrategy, Component, Input, OnInit, inject, model, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatOptionModule } from '@angular/material/core';
import { PortsMappingEntity } from '@models/ethernetHub/ports-mapping-enity';
import { BuiltInTemplatesConfigurationService } from '@services/built-in-templates-configuration.service';
import { ToasterService } from '@services/toaster.service';

@Component({
  selector: 'app-ports',
  standalone: true,
  templateUrl: './ports.component.html',
  styleUrls: ['./ports.component.scss'],
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    MatOptionModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortsComponent implements OnInit {
  @Input() ethernetPorts: PortsMappingEntity[] = [];

  readonly newPortNumber = model<number>(0);
  readonly newPortVlan = model<number>(1);
  readonly newPortType = model<string>('access');
  readonly newPortEthertype = model<string>('0x8100');

  private builtInTemplatesConfigurationService = inject(BuiltInTemplatesConfigurationService);
  private toasterService = inject(ToasterService);

  readonly portTypes = signal<string[]>([]);
  readonly etherTypes = signal<string[]>([]);
  displayedColumns: string[] = ['port_number', 'vlan', 'type', 'ethertype', 'action'];

  ngOnInit() {
    this.getConfiguration();
    this.newPortNumber.set(this.ethernetPorts.length);
  }

  getConfiguration() {
    this.etherTypes.set(this.builtInTemplatesConfigurationService.getEtherTypesForEthernetSwitches());
    this.portTypes.set(this.builtInTemplatesConfigurationService.getPortTypesForEthernetSwitches());
  }

  onAdd() {
    const portExists = this.ethernetPorts.some((p) => p.port_number === this.newPortNumber());
    if (portExists) {
      this.toasterService.error(`Port number ${this.newPortNumber()} already exists.`);
      return;
    }

    const port: PortsMappingEntity = {
      name: 'Ethernet' + this.newPortNumber(),
      port_number: this.newPortNumber(),
      vlan: this.newPortVlan(),
      type: this.newPortType(),
      ethertype: this.newPortEthertype(),
    };
    this.ethernetPorts.push(port);
    this.ethernetPorts = [].concat(this.ethernetPorts); // this forces the refresh of the table
    this.newPortNumber.set(this.ethernetPorts.length);
  }

  delete(port: PortsMappingEntity) {
    this.ethernetPorts = this.ethernetPorts.filter((n) => n !== port);
  }
}

import { ChangeDetectionStrategy, Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
import { ToasterService } from "@services/toaster.service";

@Component({
  selector: 'app-ports',
  standalone: true,
  templateUrl: './ports.component.html',
  styleUrls: ['./ports.component.scss'],
  imports: [CommonModule, FormsModule, MatTableModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatTooltipModule, MatOptionModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortsComponent implements OnInit {
  @Input() ethernetPorts: PortsMappingEntity[] = [];
  newPort: PortsMappingEntity = {
    name: '',
    port_number: 0,
    vlan: 1,
    type: 'access',
    ethertype: '0x8100',
  };

  private builtInTemplatesConfigurationService = inject(BuiltInTemplatesConfigurationService);
  private toasterService = inject(ToasterService);

  readonly portTypes = signal<string[]>([]);
  readonly etherTypes = signal<string[]>([]);
  displayedColumns: string[] = ['port_number', 'vlan', 'type', 'ethertype', 'action'];

  ngOnInit() {
    this.getConfiguration();
    this.newPort.port_number = this.ethernetPorts.length;
  }

  getConfiguration() {
    this.etherTypes.set(this.builtInTemplatesConfigurationService.getEtherTypesForEthernetSwitches());
    this.portTypes.set(this.builtInTemplatesConfigurationService.getPortTypesForEthernetSwitches());
  }

  onAdd() {

    const portExists = this.ethernetPorts.some(p => p.port_number === this.newPort.port_number);
    if (portExists) {
      this.toasterService.error(`Port number ${this.newPort.port_number} already exists.`);
      return;
    }

    const port: PortsMappingEntity = { ...this.newPort };
    port.name = "Ethernet" + port.port_number;
    this.ethernetPorts.push(port);
    this.ethernetPorts = [].concat(this.ethernetPorts); // this forces the refresh of the table
    this.newPort.port_number = this.ethernetPorts.length;
  }

  delete(port: PortsMappingEntity) {
    this.ethernetPorts = this.ethernetPorts.filter((n) => n !== port);
  }
}

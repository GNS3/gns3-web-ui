import { Component, Input, OnInit } from '@angular/core';
import { PortsMappingEntity } from '../../../../models/ethernetHub/ports-mapping-enity';
import { BuiltInTemplatesConfigurationService } from '../../../../services/built-in-templates-configuration.service';
import { ToasterService } from "@services/toaster.service";

@Component({
  selector: 'app-ports',
  templateUrl: './ports.component.html',
  styleUrls: ['../../preferences.component.scss'],
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

  portTypes: string[] = [];
  etherTypes: string[] = [];
  displayedColumns: string[] = ['port_number', 'vlan', 'type', 'ethertype', 'action'];

  constructor(
    private builtInTemplatesConfigurationService: BuiltInTemplatesConfigurationService,
    private toasterService: ToasterService,
  ) {}

  ngOnInit() {
    this.getConfiguration();
    this.newPort.port_number = this.ethernetPorts.length;
  }

  getConfiguration() {
    this.etherTypes = this.builtInTemplatesConfigurationService.getEtherTypesForEthernetSwitches();
    this.portTypes = this.builtInTemplatesConfigurationService.getPortTypesForEthernetSwitches();
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

import { Component, Input, OnInit } from '@angular/core';
import { PortsMappingEntity } from '../../../../models/ethernetHub/ports-mapping-enity';
import { BuiltInTemplatesConfigurationService } from '../../../../services/built-in-templates-configuration.service';

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
  };

  portTypes: string[] = [];
  etherTypes: string[] = [];
  displayedColumns: string[] = ['port_number', 'vlan', 'type', 'ethertype', 'action'];

  constructor(private builtInTemplatesConfigurationService: BuiltInTemplatesConfigurationService) {}

  ngOnInit() {
    this.getConfiguration();
  }

  getConfiguration() {
    this.etherTypes = this.builtInTemplatesConfigurationService.getEtherTypesForEthernetSwitches();
    this.portTypes = this.builtInTemplatesConfigurationService.getPortTypesForEthernetSwitches();
  }

  onAdd() {
    this.ethernetPorts.push(this.newPort);

    this.newPort = {
      name: '',
      port_number: 0,
    };
  }

  delete(port: PortsMappingEntity) {
    this.ethernetPorts = this.ethernetPorts.filter((n) => n !== port);
  }
}

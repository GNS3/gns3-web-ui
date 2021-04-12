import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Server } from '../../../../models/server';
import { PortsMappingEntity } from '../../../../models/ethernetHub/ports-mapping-enity';
import { BuiltInTemplatesConfigurationService } from '../../../../services/built-in-templates-configuration.service';

@Component({
  selector: 'app-udp-tunnels',
  templateUrl: './udp-tunnels.component.html',
  styleUrls: ['../../preferences.component.scss'],
})
export class UdpTunnelsComponent implements OnInit {
  @Input() dataSourceUdp: PortsMappingEntity[] = [];
  displayedColumns: string[] = ['name', 'lport', 'rhost', 'rport', 'action'];
  newPort: PortsMappingEntity = {
    name: '',
    port_number: 0,
  };
  portTypes: string[] = [];
  etherTypes: string[] = [];

  constructor(private builtInTemplatesConfigurationService: BuiltInTemplatesConfigurationService) {}

  ngOnInit() {
    this.getConfiguration();
  }

  getConfiguration() {
    this.etherTypes = this.builtInTemplatesConfigurationService.getEtherTypesForEthernetSwitches();
    this.portTypes = this.builtInTemplatesConfigurationService.getPortTypesForEthernetSwitches();
  }

  onAddUdpInterface() {
    this.dataSourceUdp = this.dataSourceUdp.concat([this.newPort]);

    this.newPort = {
      name: '',
      port_number: 0,
    };
  }

  delete(port: PortsMappingEntity) {
    this.dataSourceUdp = this.dataSourceUdp.filter((n) => n !== port);
  }
}

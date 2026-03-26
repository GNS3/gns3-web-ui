import { ChangeDetectionStrategy, Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PortsMappingEntity } from '@models/ethernetHub/ports-mapping-enity';
import { BuiltInTemplatesConfigurationService } from '@services/built-in-templates-configuration.service';

@Component({
  selector: 'app-udp-tunnels',
  templateUrl: './udp-tunnels.component.html',
  styleUrl: '../../preferences.component.scss',
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UdpTunnelsComponent implements OnInit {
  @Input() dataSourceUdp: PortsMappingEntity[] = [];
  displayedColumns: string[] = ['name', 'lport', 'rhost', 'rport', 'action'];
  newPort: PortsMappingEntity = {
    name: '',
    port_number: 0,
  };
  readonly portTypes = signal<string[]>([]);
  readonly etherTypes = signal<string[]>([]);

  private builtInTemplatesConfigurationService = inject(BuiltInTemplatesConfigurationService);

  ngOnInit() {
    this.getConfiguration();
  }

  getConfiguration() {
    this.etherTypes.set(this.builtInTemplatesConfigurationService.getEtherTypesForEthernetSwitches());
    this.portTypes.set(this.builtInTemplatesConfigurationService.getPortTypesForEthernetSwitches());
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

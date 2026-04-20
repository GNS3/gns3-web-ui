import { ChangeDetectionStrategy, Component, Input, OnInit, inject, model, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
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

  readonly newPortName = model('');
  readonly newPortLport = model<number>(0);
  readonly newPortRhost = model('');
  readonly newPortRport = model<number>(0);

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
    const newPort: PortsMappingEntity = {
      name: this.newPortName(),
      lport: this.newPortLport(),
      rhost: this.newPortRhost(),
      rport: this.newPortRport(),
      port_number: 0,
    };
    this.dataSourceUdp = this.dataSourceUdp.concat([newPort]);

    this.newPortName.set('');
    this.newPortLport.set(0);
    this.newPortRhost.set('');
    this.newPortRport.set(0);
  }

  delete(port: PortsMappingEntity) {
    this.dataSourceUdp = this.dataSourceUdp.filter((n) => n !== port);
  }
}

import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule, MatChipInputEvent } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { PortsMappingEntity } from '@models/ethernetHub/ports-mapping-enity';
import { Controller } from '@models/controller';
import { CloudTemplate } from '@models/templates/cloud-template';
import { BuiltInTemplatesConfigurationService } from '@services/built-in-templates-configuration.service';
import { BuiltInTemplatesService } from '@services/built-in-templates.service';
import { ControllerService } from '@services/controller.service';
import { ToasterService } from '@services/toaster.service';
import { UdpTunnelsComponent } from '@components/preferences/common/udp-tunnels/udp-tunnels.component';
import { SymbolsMenuComponent } from '@components/preferences/common/symbols-menu/symbols-menu.component';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-cloud-nodes-template-details',
  templateUrl: './cloud-nodes-template-details.component.html',
  styleUrls: ['./cloud-nodes-template-details.component.scss', '../../../preferences.component.scss'],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, MatIconModule, MatButtonModule, MatCardModule, MatTabsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatChipsModule, MatTableModule, SymbolsMenuComponent]
})
export class CloudNodesTemplateDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private controllerService = inject(ControllerService);
  private builtInTemplatesService = inject(BuiltInTemplatesService);
  private toasterService = inject(ToasterService);
  private builtInTemplatesConfigurationService = inject(BuiltInTemplatesConfigurationService);
  private router = inject(Router);
  private cd = inject(ChangeDetectorRef);

  controller: Controller;
  cloudNodeTemplate: CloudTemplate;

  isSymbolSelectionOpened: boolean = false;
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];

  categories = [];
  consoleTypes: string[] = [];

  tapInterface: string = '';
  ethernetInterface: string = '';
  ethernetInterfaces: string[] = ['Ethernet 2', 'Ethernet 3'];
  portsMappingEthernet: PortsMappingEntity[] = [];
  portsMappingTap: PortsMappingEntity[] = [];
  portsMappingUdp: PortsMappingEntity[] = [];
  newPort: PortsMappingEntity;
  displayedColumns: string[] = ['name', 'lport', 'rhost', 'rport'];
  dataSourceUdp: PortsMappingEntity[] = [];

  constructor() {
    this.newPort = {
      name: '',
      port_number: 0,
    };
  }

  ngOnInit() {
    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    const template_id = this.route.snapshot.paramMap.get('template_id');
    this.controllerService.get(parseInt(controller_id, 10)).then((controller: Controller ) => {
      this.controller = controller;
      this.cd.markForCheck();

      this.getConfiguration();
      this.builtInTemplatesService
        .getTemplate(this.controller, template_id)
        .subscribe((cloudNodeTemplate: CloudTemplate) => {
          this.cloudNodeTemplate = cloudNodeTemplate;

          if (!this.cloudNodeTemplate.tags) {
            this.cloudNodeTemplate.tags = [];
          }

          this.portsMappingEthernet = this.cloudNodeTemplate.ports_mapping.filter((elem) => elem.type === 'ethernet');

          this.portsMappingTap = this.cloudNodeTemplate.ports_mapping.filter((elem) => elem.type === 'tap');

          this.portsMappingUdp = this.cloudNodeTemplate.ports_mapping.filter((elem) => elem.type === 'udp');

          this.dataSourceUdp = this.portsMappingUdp;
          this.cd.markForCheck();
        });
    });
  }

  goBack() {
    this.router.navigate(['/controller', this.controller.id, 'preferences', 'builtin', 'cloud-nodes']);
  }

  getConfiguration() {
    this.categories = this.builtInTemplatesConfigurationService.getCategoriesForCloudNodes();
    this.consoleTypes = this.builtInTemplatesConfigurationService.getConsoleTypesForCloudNodes();
  }

  onAddEthernetInterface() {
    if (this.ethernetInterface) {
      this.portsMappingEthernet.push({
        interface: this.ethernetInterface,
        name: this.ethernetInterface,
        port_number: 0,
        type: 'ethernet',
      });
    }
  }

  onAddTapInterface() {
    if (this.tapInterface) {
      this.portsMappingTap.push({
        interface: this.tapInterface,
        name: this.tapInterface,
        port_number: 0,
        type: 'tap',
      });
    }
  }

  onAddUdpInterface() {
    this.portsMappingUdp.push(this.newPort);
    this.dataSourceUdp = [...this.portsMappingUdp];

    this.newPort = {
      name: '',
      port_number: 0,
    };
  }

  onSave() {
    this.cloudNodeTemplate.ports_mapping = [...this.portsMappingEthernet, ...this.portsMappingTap];

    this.builtInTemplatesService
      .saveTemplate(this.controller, this.cloudNodeTemplate)
      .subscribe((cloudNodeTemplate: CloudTemplate) => {
        this.toasterService.success('Changes saved');
      });
  }

  chooseSymbol() {
    this.isSymbolSelectionOpened = !this.isSymbolSelectionOpened;
  }

  symbolChanged(chosenSymbol: string) {
    this.isSymbolSelectionOpened = !this.isSymbolSelectionOpened;
    this.cloudNodeTemplate.symbol = chosenSymbol;
  }

  addTag(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();

    if (value && this.cloudNodeTemplate) {
      if (!this.cloudNodeTemplate.tags) {
        this.cloudNodeTemplate.tags = [];
      }
      this.cloudNodeTemplate.tags.push(value);
    }

    // Clear the input value
    if (event.chipInput) {
      event.chipInput.clear();
    }
  }

  removeTag(tag: string): void {
    if (!this.cloudNodeTemplate.tags) {
      return;
    }
    const index = this.cloudNodeTemplate.tags.indexOf(tag);

    if (index >= 0) {
      this.cloudNodeTemplate.tags.splice(index, 1);
    }
  }
}

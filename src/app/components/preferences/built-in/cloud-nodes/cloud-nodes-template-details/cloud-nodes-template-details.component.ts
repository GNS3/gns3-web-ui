import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, model, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule, MatChipInputEvent } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { PortsMappingEntity } from '@models/ethernetHub/ports-mapping-enity';
import { Controller } from '@models/controller';
import { CloudTemplate } from '@models/templates/cloud-template';
import { BuiltInTemplatesConfigurationService } from '@services/built-in-templates-configuration.service';
import { BuiltInTemplatesService } from '@services/built-in-templates.service';
import { ControllerService } from '@services/controller.service';
import { ToasterService } from '@services/toaster.service';
import { TemplateSymbolDialogComponent } from '@components/project-map/template-symbol-dialog/template-symbol-dialog.component';
import { DialogConfigService } from '@services/dialog-config.service';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-cloud-nodes-template-details',
  templateUrl: './cloud-nodes-template-details.component.html',
  styleUrls: ['./cloud-nodes-template-details.component.scss', '../../../preferences.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatTableModule,
  ],
})
export class CloudNodesTemplateDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private controllerService = inject(ControllerService);
  private builtInTemplatesService = inject(BuiltInTemplatesService);
  private toasterService = inject(ToasterService);
  private builtInTemplatesConfigurationService = inject(BuiltInTemplatesConfigurationService);
  private router = inject(Router);
  private cd = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);
  private dialogConfig = inject(DialogConfigService);

  controller: Controller;
  cloudNodeTemplate: CloudTemplate;

  readonly separatorKeysCodes: number[] = [ENTER, COMMA];

  categories: any[] = [];
  consoleTypes: string[] = [];
  ethernetInterfaces: string[] = ['Ethernet 2', 'Ethernet 3'];
  displayedColumns: string[] = ['name', 'lport', 'rhost', 'rport'];

  // Section expansion state
  generalExpanded = false;
  ethernetExpanded = false;
  tapExpanded = false;
  udpExpanded = false;
  usageExpanded = false;

  // Model signals for form fields
  name = model('');
  defaultNameFormat = model('');
  symbol = model('');
  category = model('');
  consoleType = model('');
  consoleHost = model('');
  consolePort = model<number>(0);
  consoleHttpPath = model('');
  usage = model('');
  tags = model<string[]>([]);

  // Interface models
  ethernetInterface = model('');
  tapInterface = model('');

  // Port mappings
  portsMappingEthernet: PortsMappingEntity[] = [];
  portsMappingTap: PortsMappingEntity[] = [];
  portsMappingUdp: PortsMappingEntity[] = [];
  dataSourceUdp: PortsMappingEntity[] = [];

  // New UDP port
  newPortName = model('');
  newPortLport = model(0);
  newPortRhost = model('');
  newPortRport = model(0);

  ngOnInit() {
    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    const template_id = this.route.snapshot.paramMap.get('template_id');
    this.controllerService.get(parseInt(controller_id, 10)).then((controller: Controller) => {
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

          // Initialize model signals
          this.name.set(cloudNodeTemplate.name || '');
          this.defaultNameFormat.set(cloudNodeTemplate.default_name_format || '');
          this.symbol.set(cloudNodeTemplate.symbol || '');
          this.category.set(cloudNodeTemplate.category || '');
          this.consoleType.set(cloudNodeTemplate.remote_console_type || '');
          this.consoleHost.set(cloudNodeTemplate.remote_console_host || '');
          this.consolePort.set(cloudNodeTemplate.remote_console_port || 0);
          this.consoleHttpPath.set(cloudNodeTemplate.remote_console_http_path || '');
          this.usage.set(cloudNodeTemplate.usage || '');
          this.tags.set(cloudNodeTemplate.tags || []);

          this.portsMappingEthernet = this.cloudNodeTemplate.ports_mapping.filter((elem) => elem.type === 'ethernet');
          this.portsMappingTap = this.cloudNodeTemplate.ports_mapping.filter((elem) => elem.type === 'tap');
          this.portsMappingUdp = this.cloudNodeTemplate.ports_mapping.filter((elem) => elem.type === 'udp');
          this.dataSourceUdp = [...this.portsMappingUdp];

          this.cd.markForCheck();
        });
    });
  }

  goBack() {
    this.router.navigate(['/controller', this.controller.id, 'preferences', 'builtin', 'cloud-nodes']);
  }

  toggleSection(section: string) {
    switch (section) {
      case 'general':
        this.generalExpanded = !this.generalExpanded;
        break;
      case 'ethernet':
        this.ethernetExpanded = !this.ethernetExpanded;
        break;
      case 'tap':
        this.tapExpanded = !this.tapExpanded;
        break;
      case 'udp':
        this.udpExpanded = !this.udpExpanded;
        break;
      case 'usage':
        this.usageExpanded = !this.usageExpanded;
        break;
    }
  }

  getConfiguration() {
    this.categories = this.builtInTemplatesConfigurationService.getCategoriesForCloudNodes();
    this.consoleTypes = this.builtInTemplatesConfigurationService.getConsoleTypesForCloudNodes();
  }

  onAddEthernetInterface() {
    const ethInterface = this.ethernetInterface();
    if (ethInterface) {
      this.portsMappingEthernet.push({
        interface: ethInterface,
        name: ethInterface,
        port_number: 0,
        type: 'ethernet',
      });
      this.ethernetInterface.set('');
      this.cd.markForCheck();
    }
  }

  onAddTapInterface() {
    const tap = this.tapInterface();
    if (tap) {
      this.portsMappingTap.push({
        interface: tap,
        name: tap,
        port_number: 0,
        type: 'tap',
      });
      this.tapInterface.set('');
      this.cd.markForCheck();
    }
  }

  onAddUdpInterface() {
    const newPort: PortsMappingEntity = {
      name: this.newPortName(),
      lport: this.newPortLport(),
      rhost: this.newPortRhost(),
      rport: this.newPortRport(),
      port_number: 0,
    };
    this.portsMappingUdp.push(newPort);
    this.dataSourceUdp = [...this.portsMappingUdp];

    this.newPortName.set('');
    this.newPortLport.set(0);
    this.newPortRhost.set('');
    this.newPortRport.set(0);
    this.cd.markForCheck();
  }

  onSave() {
    // Update cloudNodeTemplate from model signals
    this.cloudNodeTemplate.name = this.name();
    this.cloudNodeTemplate.default_name_format = this.defaultNameFormat();
    this.cloudNodeTemplate.symbol = this.symbol();
    this.cloudNodeTemplate.category = this.category();
    this.cloudNodeTemplate.remote_console_type = this.consoleType();
    this.cloudNodeTemplate.remote_console_host = this.consoleHost();
    this.cloudNodeTemplate.remote_console_port = this.consolePort();
    this.cloudNodeTemplate.remote_console_http_path = this.consoleHttpPath();
    this.cloudNodeTemplate.usage = this.usage();
    this.cloudNodeTemplate.tags = this.tags();

    this.cloudNodeTemplate.ports_mapping = [
      ...this.portsMappingEthernet,
      ...this.portsMappingTap,
      ...this.portsMappingUdp,
    ];

    this.builtInTemplatesService
      .saveTemplate(this.controller, this.cloudNodeTemplate)
      .subscribe((cloudNodeTemplate: CloudTemplate) => {
        this.toasterService.success('Changes saved');
      });
  }

  chooseSymbol() {
    const dialogConfig = this.dialogConfig.openConfig('templateSymbol', {
      autoFocus: false,
      disableClose: false,
      data: {
        controller: this.controller,
        symbol: this.symbol(),
      },
    });
    const dialogRef = this.dialog.open(TemplateSymbolDialogComponent, dialogConfig);
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.symbol.set(result);
      }
    });
  }

  addTag(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    const currentTags = this.tags();

    if (value) {
      this.tags.set([...currentTags, value]);
    }

    if (event.chipInput) {
      event.chipInput.clear();
    }
  }

  removeTag(tag: string): void {
    const currentTags = this.tags();
    const index = currentTags.indexOf(tag);

    if (index >= 0) {
      const newTags = [...currentTags];
      newTags.splice(index, 1);
      this.tags.set(newTags);
    }
  }
}

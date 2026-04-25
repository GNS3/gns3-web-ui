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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Controller } from '@models/controller';
import { IouTemplate } from '@models/templates/iou-template';
import { IouConfigurationService } from '@services/iou-configuration.service';
import { IouService } from '@services/iou.service';
import { ControllerService } from '@services/controller.service';
import { ToasterService } from '@services/toaster.service';
import { TemplateSymbolDialogComponent } from '@components/project-map/template-symbol-dialog/template-symbol-dialog.component';
import { DialogConfigService } from '@services/dialog-config.service';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-iou-template-details',
  templateUrl: './iou-template-details.component.html',
  styleUrls: ['./iou-template-details.component.scss', '../../preferences.component.scss'],
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
    MatCheckboxModule,
  ],
})
export class IouTemplateDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private controllerService = inject(ControllerService);
  private iouService = inject(IouService);
  private toasterService = inject(ToasterService);
  private configurationService = inject(IouConfigurationService);
  private router = inject(Router);
  private cd = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);
  private dialogConfig = inject(DialogConfigService);

  controller: Controller;
  iouTemplate: IouTemplate;

  readonly separatorKeysCodes: number[] = [ENTER, COMMA];

  consoleTypes: string[] = [];
  categories: any[] = [];

  // Model signals for form fields
  templateName = model('');
  defaultName = model('');
  symbol = model('');
  path = model('');
  initialConfig = model('');
  privateConfig = model('');
  category = model('');
  consoleType = model('');
  consoleAutoStart = model(false);
  l1Keepalives = model(false);
  useDefaultIouValues = model(false);
  ram = model(256);
  nvram = model(128);
  ethernetAdapters = model(0);
  serialAdapters = model(0);
  usage = model('');
  tags = model<string[]>([]);

  // Section collapse states
  generalSettingsExpanded = model(false);
  networkExpanded = model(false);
  usageExpanded = model(false);

  ngOnInit() {
    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    const template_id = this.route.snapshot.paramMap.get('template_id');
    this.controllerService.get(parseInt(controller_id, 10)).then(
      (controller: Controller) => {
        this.controller = controller;
        this.cd.markForCheck();

        this.getConfiguration();
        this.iouService.getTemplate(this.controller, template_id).subscribe({
          next: (iouTemplate: IouTemplate) => {
            this.iouTemplate = iouTemplate;
            if (!this.iouTemplate.tags) {
              this.iouTemplate.tags = [];
            }

            // Initialize model signals
            this.templateName.set(iouTemplate.name || '');
            this.defaultName.set(iouTemplate.default_name_format || '');
            this.symbol.set(iouTemplate.symbol || '');
            this.path.set(iouTemplate.path || '');
            this.initialConfig.set(iouTemplate.startup_config || '');
            this.privateConfig.set(iouTemplate.private_config || '');
            this.category.set(iouTemplate.category || '');
            this.consoleType.set(iouTemplate.console_type || '');
            this.consoleAutoStart.set(iouTemplate.console_auto_start || false);
            this.l1Keepalives.set(iouTemplate.l1_keepalives || false);
            this.useDefaultIouValues.set(iouTemplate.use_default_iou_values !== false);
            this.ram.set(iouTemplate.ram || 256);
            this.nvram.set(iouTemplate.nvram || 128);
            this.ethernetAdapters.set(iouTemplate.ethernet_adapters || 0);
            this.serialAdapters.set(iouTemplate.serial_adapters || 0);
            this.usage.set(iouTemplate.usage || '');
            this.tags.set(iouTemplate.tags || []);

            this.cd.markForCheck();
          },
          error: (err) => {
            const message = err.error?.message || err.message || 'Failed to load IOU template';
            this.toasterService.error(message);
            this.cd.markForCheck();
          },
        });
      },
      (err) => {
        const message = err.error?.message || err.message || 'Failed to load controller';
        this.toasterService.error(message);
        this.cd.markForCheck();
      }
    );
  }

  getConfiguration() {
    this.consoleTypes = this.configurationService.getConsoleTypes();
    this.categories = this.configurationService.getCategories();
  }

  goBack() {
    this.router.navigate(['/controller', this.controller.id, 'preferences', 'iou', 'templates']);
  }

  onSave() {
    // Update iouTemplate from model signals
    this.iouTemplate.name = this.templateName();
    this.iouTemplate.default_name_format = this.defaultName();
    this.iouTemplate.symbol = this.symbol();
    this.iouTemplate.path = this.path();
    this.iouTemplate.startup_config = this.initialConfig();
    this.iouTemplate.private_config = this.privateConfig();
    this.iouTemplate.category = this.category();
    this.iouTemplate.console_type = this.consoleType();
    this.iouTemplate.console_auto_start = this.consoleAutoStart();
    this.iouTemplate.l1_keepalives = this.l1Keepalives();
    this.iouTemplate.use_default_iou_values = this.useDefaultIouValues();
    this.iouTemplate.ram = this.ram();
    this.iouTemplate.nvram = this.nvram();
    this.iouTemplate.ethernet_adapters = this.ethernetAdapters();
    this.iouTemplate.serial_adapters = this.serialAdapters();
    this.iouTemplate.usage = this.usage();
    this.iouTemplate.tags = this.tags();

    this.iouService.saveTemplate(this.controller, this.iouTemplate).subscribe({
        next: () => {
          this.toasterService.success('Changes saved');
        },
        error: (err) => {
          const message = err.error?.message || err.message || 'Failed to save IOU template';
          this.toasterService.error(message);
          this.cd.markForCheck();
        },
      });
  }

  uploadImageFile(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.path.set(input.files[0].name);
    }
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

  toggleSection(section: string): void {
    switch (section) {
      case 'general':
        this.generalSettingsExpanded.set(!this.generalSettingsExpanded());
        break;
      case 'network':
        this.networkExpanded.set(!this.networkExpanded());
        break;
      case 'usage':
        this.usageExpanded.set(!this.usageExpanded());
        break;
    }
  }
}

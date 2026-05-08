import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule, MatChipInputEvent } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { IosConfigurationService } from '@services/ios-configuration.service';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';
import { IosValidationService } from '@services/validation';

@Component({
  standalone: true,
  selector: 'app-configurator-ios',
  templateUrl: './configurator-ios.component.html',
  styleUrls: ['../configurator.component.scss', './configurator-ios.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatCardModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatCheckboxModule,
  ],
})
export class ConfiguratorDialogIosComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<ConfiguratorDialogIosComponent>);
  private nodeService = inject(NodeService);
  private toasterService = inject(ToasterService);
  private configurationService = inject(IosConfigurationService);
  private cd = inject(ChangeDetectorRef);
  private validationService = inject(IosValidationService);

  controller: Controller;
  node: Node;
  name: string;
  consoleTypes: string[] = [];
  NPETypes: string[] = [];
  MidplaneTypes: string[] = [];
  adapterMatrix = {};
  wicMatrix = {};
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];

  // Model signals
  readonly nodeName = model('');
  readonly imagePath = model('');
  readonly midplane = model('');
  readonly npe = model('');
  readonly consoleType = model('');
  readonly auxType = model('');
  readonly consoleAutoStart = model(false);
  // Slots (0-6)
  readonly slot0 = model(''); readonly slot1 = model(''); readonly slot2 = model('');
  readonly slot3 = model(''); readonly slot4 = model(''); readonly slot5 = model('');
  readonly slot6 = model('');
  // WICs (0-2)
  readonly wic0 = model(''); readonly wic1 = model(''); readonly wic2 = model('');
  // Memory
  readonly ram = model('');
  readonly nvram = model('');
  readonly iomem = model('');
  readonly disk0 = model('');
  readonly disk1 = model('');
  readonly autoDeleteDisks = model(false);
  // Advanced
  readonly systemId = model('');
  readonly baseMac = model('');
  readonly idlepc = model('');
  readonly idlemax = model('');
  readonly idlesleep = model('');
  readonly execArea = model('');
  readonly mmap = model(false);
  readonly sparsemem = model(false);
  readonly usage = model('');

  ngOnInit() {
    this.nodeService.getNode(this.controller, this.node).subscribe({
      next: (node: Node) => {
        this.node = node;
        this.name = node.name;

        // Update model signals with node data
        this.nodeName.set(node.name || '');
        this.imagePath.set(node.properties.image || '');
        this.midplane.set(node.properties.midplane || '');
        this.npe.set(node.properties.npe || '');
        this.consoleType.set(node.console_type || '');
        this.auxType.set(node.aux_type || '');
        this.consoleAutoStart.set(node.console_auto_start || false);
        this.slot0.set(node.properties.slot0 || ''); this.slot1.set(node.properties.slot1 || '');
        this.slot2.set(node.properties.slot2 || ''); this.slot3.set(node.properties.slot3 || '');
        this.slot4.set(node.properties.slot4 || ''); this.slot5.set(node.properties.slot5 || '');
        this.slot6.set(node.properties.slot6 || '');
        this.wic0.set(node.properties.wic0 || ''); this.wic1.set(node.properties.wic1 || '');
        this.wic2.set(node.properties.wic2 || '');
        this.ram.set(node.properties.ram?.toString() || '');
        this.nvram.set(node.properties.nvram?.toString() || '');
        this.iomem.set(node.properties.iomem?.toString() || '');
        this.disk0.set(node.properties.disk0?.toString() || '');
        this.disk1.set(node.properties.disk1?.toString() || '');
        this.autoDeleteDisks.set(node.properties.auto_delete_disks || false);
        this.systemId.set(node.properties.system_id || '');
        this.baseMac.set(node.properties.mac_addr || '');
        this.idlepc.set(node.properties.idlepc || '');
        this.idlemax.set(node.properties.idlemax?.toString() || '');
        this.idlesleep.set(node.properties.idlesleep?.toString() || '');
        this.execArea.set(node.properties.exec_area?.toString() || '');
        this.mmap.set(node.properties.mmap || false);
        this.sparsemem.set(node.properties.sparsemem || false);
        this.usage.set(node.properties.usage || '');

        if (!this.node.tags) {
          this.node.tags = [];
        }
        this.getConfiguration();
        this.fillSlotsData();
        this.cd.markForCheck();
      },
      error: (err) => {
        const message = err.error?.message || err.message || 'Failed to load node';
        this.toasterService.error(message);
        this.cd.markForCheck();
      },
    });
  }

  getConfiguration() {
    this.consoleTypes = this.configurationService.getConsoleTypes();
    this.NPETypes = this.configurationService.getNPETypes();
    this.MidplaneTypes = this.configurationService.getMidplaneTypes();
    this.adapterMatrix = this.configurationService.getAdapterMatrix();
    this.wicMatrix = this.configurationService.getWicMatrix();
  }

  fillSlotsData() {
    // Slots and WICs are now directly in the form, no need to load separately
    // This method is kept for compatibility but does nothing
  }

  // Template helpers for dynamic slot/WIC access
  getSlotValue(index: number): string {
    return [this.slot0(), this.slot1(), this.slot2(), this.slot3(), this.slot4(), this.slot5(), this.slot6()][index] || '';
  }
  setSlotValue(index: number, value: string) {
    [this.slot0, this.slot1, this.slot2, this.slot3, this.slot4, this.slot5, this.slot6][index]?.set(value);
  }
  getWicValue(index: number): string {
    return [this.wic0(), this.wic1(), this.wic2()][index] || '';
  }
  setWicValue(index: number, value: string) {
    [this.wic0, this.wic1, this.wic2][index]?.set(value);
  }

  saveSlotsData() {
    const slots = [this.slot0(), this.slot1(), this.slot2(), this.slot3(), this.slot4(), this.slot5(), this.slot6()];
    const wics = [this.wic0(), this.wic1(), this.wic2()];
    const platform = this.node.properties.platform;
    const chassis = this.node.properties.chassis || '';

    for (let i = 0; i <= 6; i++) {
      const slotAdapters = this.adapterMatrix?.[platform]?.[chassis]?.[i];
      if (slotAdapters) {
        this.node.properties[`slot${i}`] = slots[i] || '';
      } else {
        delete this.node.properties[`slot${i}`];
      }
    }

    for (let i = 0; i <= 2; i++) {
      const wicAdapters = this.wicMatrix?.[platform]?.[i];
      if (wicAdapters) {
        this.node.properties[`wic${i}`] = wics[i] || '';
      } else {
        delete this.node.properties[`wic${i}`];
      }
    }
  }

  onSaveClick() {
    // Validate required fields
    const nameValidation = this.validationService.validateName(this.nodeName());
    if (!nameValidation.isValid) { this.toasterService.error(nameValidation.errorMessage); return; }
    const pathValidation = this.validationService.validateImagePath(this.imagePath());
    if (!pathValidation.isValid) { this.toasterService.error(pathValidation.errorMessage); return; }
    const platform = this.node.properties.platform;
    const ramValidation = this.validationService.validateRamForPlatform(this.ram(), platform);
    if (!ramValidation.isValid) { this.toasterService.error(ramValidation.errorMessage); return; }
    const nvramValidation = this.validationService.validateNvramForPlatform(this.nvram(), platform);
    if (!nvramValidation.isValid) { this.toasterService.error(nvramValidation.errorMessage); return; }
    // Validate optional fields
    const macValidation = this.validationService.validateMacAddress(this.baseMac());
    if (!macValidation.isValid) { this.toasterService.error(macValidation.errorMessage); return; }
    const idlepcValidation = this.validationService.validateIdlepc(this.idlepc());
    if (!idlepcValidation.isValid) { this.toasterService.error(idlepcValidation.errorMessage); return; }
    if (this.iomem()) {
      const iomemValidation = this.validationService.validateIomem(this.iomem());
      if (!iomemValidation.isValid) { this.toasterService.error(iomemValidation.errorMessage); return; }
    }

    // Merge signal values back into node
    this.node.name = this.nodeName();
    this.node.properties.image = this.imagePath();

    const midplaneNpeSupported = ['c7200'];
    if (midplaneNpeSupported.includes(this.node.properties.platform)) {
      this.node.properties.midplane = this.midplane() || null;
      this.node.properties.npe = this.npe() || null;
    } else {
      delete this.node.properties.midplane;
      delete this.node.properties.npe;
    }

    this.node.console_type = this.consoleType();
    this.node.aux_type = this.auxType();
    this.node.console_auto_start = this.consoleAutoStart();

    this.node.properties.ram = parseInt(this.ram(), 10) || 0;
    this.node.properties.nvram = parseInt(this.nvram(), 10) || 0;
    const iomemSupported = ['c1700', 'c2600', 'c2691', 'c3600', 'c3725', 'c3745'];
    if (iomemSupported.includes(this.node.properties.platform)) {
      this.node.properties.iomem = this.iomem() ? parseInt(this.iomem(), 10) : null;
    } else {
      delete this.node.properties.iomem;
    }
    this.node.properties.disk0 = parseInt(this.disk0(), 10) || 0;
    this.node.properties.disk1 = parseInt(this.disk1(), 10) || 0;
    this.node.properties.auto_delete_disks = this.autoDeleteDisks();

    this.node.properties.system_id = this.systemId();
    this.node.properties.mac_addr = this.baseMac();
    this.node.properties.idlepc = this.idlepc();
    this.node.properties.idlemax = parseInt(this.idlemax(), 10) || 0;
    this.node.properties.idlesleep = parseInt(this.idlesleep(), 10) || 0;
    this.node.properties.exec_area = parseInt(this.execArea(), 10) || 0;
    this.node.properties.mmap = this.mmap();
    this.node.properties.sparsemem = this.sparsemem();
    this.node.properties.usage = this.usage();

    this.saveSlotsData();
    this.nodeService.updateNode(this.controller, this.node).subscribe({
      next: () => {
        this.toasterService.success(`Node ${this.node.name} updated.`);
        this.onCancelClick();
      },
      error: (error: unknown) => {
        const errorMessage = (error as any)?.error?.message || (error as any)?.message || 'Failed to update node';
        this.toasterService.error(errorMessage);
        this.cd.markForCheck();
      },
    });
  }

  onCancelClick() {
    this.dialogRef.close();
  }

  addTag(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();

    if (value && this.node) {
      if (!this.node.tags) {
        this.node.tags = [];
      }
      this.node.tags.push(value);
    }

    // Clear the input value
    if (event.chipInput) {
      event.chipInput.clear();
    }
  }

  removeTag(tag: string): void {
    if (!this.node.tags) {
      return;
    }
    const index = this.node.tags.indexOf(tag);

    if (index >= 0) {
      this.node.tags.splice(index, 1);
    }
  }
}

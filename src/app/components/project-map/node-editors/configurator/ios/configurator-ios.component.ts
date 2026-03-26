import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
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

@Component({
  standalone: true,
  selector: 'app-configurator-ios',
  templateUrl: './configurator-ios.component.html',
  styleUrls: ['../configurator.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
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
  private formBuilder = inject(UntypedFormBuilder);
  private configurationService = inject(IosConfigurationService);
  private cd = inject(ChangeDetectorRef);

  controller: Controller;
  node: Node;
  name: string;
  generalSettingsForm: UntypedFormGroup;
  memoryForm: UntypedFormGroup;
  advancedSettingsForm: UntypedFormGroup;
  consoleTypes: string[] = [];
  NPETypes: string[] = [];
  MidplaneTypes: string[] = [];
  networkAdaptersForNode: string[] = [];
  wicsForNode: string[] = [];
  adapterMatrix = {};
  wicMatrix = {};
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];

  constructor() {
    this.generalSettingsForm = this.formBuilder.group({
      name: new UntypedFormControl('', Validators.required),
      path: new UntypedFormControl('', Validators.required),
    });

    this.memoryForm = this.formBuilder.group({
      ram: new UntypedFormControl('', Validators.required),
      nvram: new UntypedFormControl('', Validators.required),
    });

    this.advancedSettingsForm = this.formBuilder.group({
      mac_addr: new UntypedFormControl('', Validators.pattern(this.configurationService.getMacAddrRegex())),
      idlepc: new UntypedFormControl('', Validators.pattern(this.configurationService.getIdlepcRegex())),
    });
  }

  ngOnInit() {
    this.nodeService.getNode(this.controller, this.node).subscribe((node: Node) => {
      this.node = node;
      this.name = node.name;
      if (!this.node.tags) {
        this.node.tags = [];
      }
      this.getConfiguration();
      this.fillSlotsData();
      this.cd.markForCheck();
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
    // load network adapters
    for (let i = 0; i <= 6; i++) {
      if (this.node.properties[`slot${i}`]) {
        this.networkAdaptersForNode[i] = this.node.properties[`slot${i}`];
      }
    }

    // load WICs
    for (let i = 0; i <= 3; i++) {
      if (this.node.properties[`wic${i}`]) {
        this.wicsForNode[i] = this.node.properties[`wic${i}`];
      }
    }
  }

  saveSlotsData() {
    // save network adapters
    for (let i = 0; i <= 6; i++) {
      const platform = this.node.properties.platform;
      const chassis = this.node.properties.chassis || '';
      const slotAdapters = this.adapterMatrix?.[platform]?.[chassis]?.[i];

      if (slotAdapters) {
        if (this.networkAdaptersForNode[i] === undefined) this.node.properties[`slot${i}`] = '';
        else this.node.properties[`slot${i}`] = this.networkAdaptersForNode[i];
      } else {
        // Remove slot properties that don't exist on this platform/chassis
        delete this.node.properties[`slot${i}`];
      }
    }

    // save WICs
    for (let i = 0; i <= 3; i++) {
      const platform = this.node.properties.platform;
      const wicAdapters = this.wicMatrix?.[platform]?.[i];

      if (wicAdapters) {
        if (this.wicsForNode[i] === undefined) this.node.properties[`wic${i}`] = '';
        else this.node.properties[`wic${i}`] = this.wicsForNode[i];
      } else {
        // Remove WIC properties that don't exist on this platform
        delete this.node.properties[`wic${i}`];
      }
    }
  }

  onSaveClick() {
    if (this.generalSettingsForm.valid && this.memoryForm.valid && this.advancedSettingsForm.valid) {
      this.saveSlotsData();
      this.nodeService.updateNode(this.controller, this.node).subscribe(() => {
        this.toasterService.success(`Node ${this.node.name} updated.`);
        this.onCancelClick();
      });
    } else {
      this.toasterService.error(`Fill all required fields.`);
    }
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

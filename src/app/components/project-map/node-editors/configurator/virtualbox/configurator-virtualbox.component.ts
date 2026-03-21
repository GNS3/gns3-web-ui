import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
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
import { CustomAdaptersTableComponent } from '@components/preferences/common/custom-adapters-table/custom-adapters-table.component';
import { Controller } from '@models/controller';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';
import { VirtualBoxConfigurationService } from '@services/virtual-box-configuration.service';

@Component({
  standalone: true,
  selector: 'app-configurator-virtualbox',
  templateUrl: './configurator-virtualbox.component.html',
  styleUrls: ['../configurator.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatDialogModule, MatCardModule, MatTabsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatChipsModule, MatIconModule, MatCheckboxModule, CustomAdaptersTableComponent]
})
export class ConfiguratorDialogVirtualBoxComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<ConfiguratorDialogVirtualBoxComponent>);
  private nodeService = inject(NodeService);
  private toasterService = inject(ToasterService);
  private formBuilder = inject(UntypedFormBuilder);
  private virtualBoxConfigurationService = inject(VirtualBoxConfigurationService);
  private cd = inject(ChangeDetectorRef);

  controller: Controller;
  node: Node;
  name: string;
  generalSettingsForm: UntypedFormGroup;
  consoleTypes: string[] = [];
  onCloseOptions = [];
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];

  displayedColumns: string[] = ['adapter_number', 'port_name', 'adapter_type', 'actions'];
  networkTypes = [];

  @ViewChild('customAdapters') customAdapters: CustomAdaptersTableComponent;

  constructor() {
    this.generalSettingsForm = this.formBuilder.group({
      name: new UntypedFormControl('', Validators.required),
      ram: new UntypedFormControl('', Validators.required),
    });
  }

  ngOnInit() {
    this.nodeService.getNode(this.controller, this.node).subscribe((node: Node) => {
      this.node = node;
      this.name = node.name;
      this.getConfiguration();
      if (!this.node.tags) {
        this.node.tags = [];
      }
      this.cd.markForCheck();
    });
  }

  getConfiguration() {
    this.consoleTypes = this.virtualBoxConfigurationService.getConsoleTypes();
    this.onCloseOptions = this.virtualBoxConfigurationService.getOnCloseoptions();
    this.networkTypes = this.virtualBoxConfigurationService.getNetworkTypes();
  }

  onSaveClick() {
    if (this.generalSettingsForm.valid) {
      this.node.custom_adapters = [];
      this.customAdapters.adapters.forEach((n) => {
        this.node.custom_adapters.push({
          adapter_number: n.adapter_number,
          adapter_type: n.adapter_type,
        });
      });

      this.node.properties.adapters = this.node.custom_adapters.length;

      this.nodeService.updateNodeWithCustomAdapters(this.controller, this.node).subscribe(() => {
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

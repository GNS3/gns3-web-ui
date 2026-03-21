import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { CustomAdapter } from '@models/qemu/qemu-custom-adapter';
import { CustomAdaptersTableComponent } from '../custom-adapters-table/custom-adapters-table.component';

@Component({
  standalone: true,
  selector: 'app-custom-adapters',
  templateUrl: './custom-adapters.component.html',
  styleUrls: ['./custom-adapters.component.scss', '../../preferences.component.scss'],
  imports: [MatButtonModule, CustomAdaptersTableComponent]
})
export class CustomAdaptersComponent {
  @Input() networkTypes = [];
  @Input() displayedColumns: string[] = [];
  @Output() closeConfiguratorEmitter = new EventEmitter<boolean>();
  @Output() saveConfigurationEmitter = new EventEmitter<CustomAdapter[]>();

  @ViewChild('customAdapters') customAdapters: CustomAdaptersTableComponent;

  public adapters: CustomAdapter[];
  public numberOfAdapters: number;

  constructor() {}

  cancelConfigureCustomAdapters() {
    this.closeConfiguratorEmitter.emit(false);
  }

  configureCustomAdapters() {
    this.adapters = [];
    this.customAdapters.adapters.forEach((n) => {
      this.adapters.push({
        adapter_number: n.adapter_number,
        adapter_type: n.adapter_type,
      });
    });

    this.saveConfigurationEmitter.emit(this.adapters);
  }
}

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CustomAdapter } from '@models/qemu/qemu-custom-adapter';

@Component({
  standalone: true,
  selector: 'app-custom-adapters-table',
  templateUrl: './custom-adapters-table.component.html',
  styleUrls: ['../../preferences.component.scss'],
  imports: [CommonModule, FormsModule, MatTableModule, MatSelectModule, MatOptionModule, MatButtonModule, MatIconModule, MatTooltipModule]
})
export class CustomAdaptersTableComponent {
  @Input() networkTypes = [];
  @Input() displayedColumns: string[] = [];
  @Input() adapters: CustomAdapter[] = [];

  public numberOfAdapters: number;

  onAdd() {
    let adapter: CustomAdapter = {
      adapter_number: this.adapters.length,
      adapter_type: this.networkTypes[0],
    };
    this.adapters = this.adapters.concat([adapter]);
  }

  delete(adapter: CustomAdapter) {
    this.adapters = this.adapters.filter((elem) => elem !== adapter);
  }
}

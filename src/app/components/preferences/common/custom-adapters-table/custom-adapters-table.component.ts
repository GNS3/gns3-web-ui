import { ChangeDetectionStrategy, Component, Input, input } from '@angular/core';
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
  selector: 'app-custom-adapters-table',
  templateUrl: './custom-adapters-table.component.html',
  styleUrl: '../../preferences.component.scss',
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatSelectModule,
    MatOptionModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomAdaptersTableComponent {
  readonly networkTypes = input([]);
  readonly displayedColumns = input<string[]>([]);
  @Input() adapters: CustomAdapter[] = [];

  onAdd() {
    let adapter: CustomAdapter = {
      adapter_number: this.adapters.length,
      adapter_type: this.networkTypes()[0],
    };
    this.adapters = this.adapters.concat([adapter]);
  }

  delete(adapter: CustomAdapter) {
    this.adapters = this.adapters.filter((elem) => elem !== adapter);
  }
}

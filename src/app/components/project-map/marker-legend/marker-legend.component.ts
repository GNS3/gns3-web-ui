import { ChangeDetectionStrategy, Component, EventEmitter, Output, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MarkerRegistryService } from '@services/marker-registry.service';

@Component({
  selector: 'app-marker-legend',
  standalone: true,
  templateUrl: './marker-legend.component.html',
  styleUrl: './marker-legend.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatTooltipModule, MatIconModule, MatButtonModule],
})
export class MarkerLegendComponent {
  private readonly registry = inject(MarkerRegistryService);

  @Output() openMarkerManager = new EventEmitter<void>();

  /** Display entries (deduplicated by name, one per unique marker). */
  readonly entries = computed(() => {
    const all = this.registry.entries();
    const seen = new Map<string, { bpf: string; color: string | undefined }>();
    for (const entry of all) {
      if (!seen.has(entry.name)) {
        seen.set(entry.name, { bpf: entry.bpf, color: entry.color });
      }
    }
    const out: { name: string; bpf: string; color: string | undefined }[] = [];
    for (const [name, info] of seen) {
      out.push({ name, bpf: info.bpf, color: info.color });
    }
    return out;
  });

  onClick(): void {
    this.openMarkerManager.emit();
  }
}

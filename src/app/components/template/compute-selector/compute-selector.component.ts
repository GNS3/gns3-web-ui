import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, input, Output, AfterViewInit, ViewChild, ElementRef, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Compute } from '@models/compute';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { computed } from '@angular/core';

@Component({
  selector: 'app-compute-selector',
  templateUrl: './compute-selector.component.html',
  styleUrl: './compute-selector.component.scss',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComputeSelectorComponent implements AfterViewInit, OnDestroy {
  private cd = inject(ChangeDetectorRef);

  @ViewChild('selectorContainer') selectorContainer!: ElementRef<HTMLDivElement>;
  computes = input.required<Compute[]>();
  x = input.required<number>();
  y = input.required<number>();

  private MARGIN = 10; // Distance from icon and screen edges

  // Actual measured dimensions
  private actualWidth = signal(200);
  private actualHeight = signal(120);

  // ResizeObserver instance
  private resizeObserver: ResizeObserver;

  @Output() computeSelected = new EventEmitter<string>();

  // Smart positioning: use actual measured dimensions
  selectorX = computed(() => {
    const mouseX = this.x();
    const screenWidth = window.innerWidth;
    const selectorWidth = this.actualWidth();

    // If near right edge, position to the left
    if (mouseX + selectorWidth + this.MARGIN > screenWidth) {
      return mouseX - selectorWidth - this.MARGIN; // Flush with left side of icon
    }
    return mouseX + this.MARGIN; // Flush with right side of icon
  });

  selectorY = computed(() => {
    const mouseY = this.y();
    const screenHeight = window.innerHeight;
    const selectorHeight = this.actualHeight();

    // If near bottom edge, position above
    if (mouseY + selectorHeight + this.MARGIN > screenHeight) {
      return mouseY - selectorHeight - this.MARGIN; // Flush with top side of icon
    }
    return mouseY + this.MARGIN; // Flush with bottom side of icon
  });

  constructor() {
    // Initialize ResizeObserver
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        this.actualWidth.set(entry.contentRect.width);
        this.actualHeight.set(entry.contentRect.height);
      }
      this.cd.markForCheck();
    });
  }

  ngAfterViewInit() {
    // Measure actual dimensions
    if (this.selectorContainer?.nativeElement) {
      const rect = this.selectorContainer.nativeElement.getBoundingClientRect();
      this.actualWidth.set(rect.width);
      this.actualHeight.set(rect.height);
      this.cd.markForCheck();

      // Start observing dimension changes
      this.resizeObserver.observe(this.selectorContainer.nativeElement);
    }

    // Auto-focus container to make selector the focus target
    setTimeout(() => {
      if (this.selectorContainer?.nativeElement) {
        this.selectorContainer.nativeElement.focus();
      }
    }, 0);
  }

  ngOnDestroy() {
    // Cleanup ResizeObserver
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  selectCompute(computeId: string) {
    this.computeSelected.emit(computeId);
  }

  getComputeDisplayName(compute: Compute): string {
    if (compute.compute_id === 'local') {
      return `${compute.name} (controller)`;
    }
    return `${compute.name} (${compute.host}:${compute.port})`;
  }

  getCpuInfo(compute: Compute): string {
    const cpus = compute.capabilities?.cpus || 0;
    const usage = compute.cpu_usage_percent || 0;
    return `${usage}% / ${cpus}c`;
  }

  getMemoryInfo(compute: Compute): string {
    const totalBytes = compute.capabilities?.memory || 0;
    const usagePercent = compute.memory_usage_percent || 0;
    const totalGB = this.bytesToGB(totalBytes);
    const usedGB = (totalGB * usagePercent) / 100;
    return `${usedGB.toFixed(1)}/${totalGB.toFixed(0)} GB`;
  }

  getDiskInfo(compute: Compute): string {
    const usagePercent = compute.disk_usage_percent || 0;
    return `${usagePercent}%`;
  }

  getUsageColorClass(compute: Compute, type: 'cpu' | 'mem' | 'disk'): string {
    let usage: number;
    switch (type) {
      case 'cpu':
        usage = compute.cpu_usage_percent || 0;
        break;
      case 'mem':
        usage = compute.memory_usage_percent || 0;
        break;
      case 'disk':
        usage = compute.disk_usage_percent || 0;
        break;
    }

    if (usage < 60) {
      return 'compute-selector__usage--low';
    } else if (usage < 85) {
      return 'compute-selector__usage--medium';
    } else {
      return 'compute-selector__usage--high';
    }
  }

  private bytesToGB(bytes: number): number {
    return bytes / (1024 * 1024 * 1024);
  }
}

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

  private MARGIN = 10; // 距离图标和屏幕边缘的间距

  // 实际测量到的尺寸
  private actualWidth = signal(200);
  private actualHeight = signal(120);

  // ResizeObserver 实例
  private resizeObserver: ResizeObserver;

  @Output() computeSelected = new EventEmitter<string>();

  // 智能定位：使用实际测量到的尺寸
  selectorX = computed(() => {
    const mouseX = this.x();
    const screenWidth = window.innerWidth;
    const selectorWidth = this.actualWidth();

    // 如果靠右边边缘，移到左边
    if (mouseX + selectorWidth + this.MARGIN > screenWidth) {
      return mouseX - selectorWidth - this.MARGIN; // 紧贴图标左边
    }
    return mouseX + this.MARGIN; // 紧贴图标右边
  });

  selectorY = computed(() => {
    const mouseY = this.y();
    const screenHeight = window.innerHeight;
    const selectorHeight = this.actualHeight();

    // 如果靠下边边缘，移到上边
    if (mouseY + selectorHeight + this.MARGIN > screenHeight) {
      return mouseY - selectorHeight - this.MARGIN; // 紧贴图标上边
    }
    return mouseY + this.MARGIN; // 紧贴图标下边
  });

  constructor() {
    // 初始化 ResizeObserver
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        this.actualWidth.set(entry.contentRect.width);
        this.actualHeight.set(entry.contentRect.height);
      }
      this.cd.markForCheck();
    });
  }

  ngAfterViewInit() {
    // 测量实际尺寸
    if (this.selectorContainer?.nativeElement) {
      const rect = this.selectorContainer.nativeElement.getBoundingClientRect();
      this.actualWidth.set(rect.width);
      this.actualHeight.set(rect.height);
      this.cd.markForCheck();

      // 开始观察尺寸变化
      this.resizeObserver.observe(this.selectorContainer.nativeElement);
    }

    // 自动聚焦容器，使选择列表成为当前焦点目标
    setTimeout(() => {
      if (this.selectorContainer?.nativeElement) {
        this.selectorContainer.nativeElement.focus();
      }
    }, 0);
  }

  ngOnDestroy() {
    // 清理 ResizeObserver
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

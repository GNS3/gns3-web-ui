import { ChangeDetectionStrategy, Component, EventEmitter, input, Output, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
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
export class ComputeSelectorComponent implements AfterViewInit {
  @ViewChild('selectorContainer') selectorContainer!: ElementRef<HTMLDivElement>;
  computes = input.required<Compute[]>();
  x = input.required<number>();
  y = input.required<number>();

  private MIN_SELECTOR_WIDTH = 200;
  private MAX_SELECTOR_WIDTH = 400;
  private SELECTOR_HEIGHT = 120; // 估算高度
  private MARGIN = 10; // 距离图标和屏幕边缘的间距

  @Output() computeSelected = new EventEmitter<string>();

  // 智能定位：计算选择器实际显示位置
  selectorX = computed(() => {
    const mouseX = this.x();
    const screenWidth = window.innerWidth;

    // 使用最大宽度来计算，确保不会超出屏幕
    const selectorWidth = this.MAX_SELECTOR_WIDTH;

    // 如果靠右边边缘，移到左边
    if (mouseX + selectorWidth + this.MARGIN > screenWidth) {
      return mouseX - selectorWidth - this.MARGIN; // 紧贴图标左边
    }
    return mouseX + this.MARGIN; // 紧贴图标右边
  });

  selectorY = computed(() => {
    const mouseY = this.y();
    const screenHeight = window.innerHeight;

    // 如果靠下边边缘，移到上边
    if (mouseY + this.SELECTOR_HEIGHT + this.MARGIN > screenHeight) {
      return mouseY - this.SELECTOR_HEIGHT - this.MARGIN; // 紧贴图标上边
    }
    return mouseY + this.MARGIN; // 紧贴图标下边
  });

  ngAfterViewInit() {
    // 自动聚焦容器，使选择列表成为当前焦点目标
    setTimeout(() => {
      if (this.selectorContainer?.nativeElement) {
        this.selectorContainer.nativeElement.focus();
      }
    }, 0);
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
}

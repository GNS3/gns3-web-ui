import { ChangeDetectionStrategy, Component, EventEmitter, input, Output } from '@angular/core';
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
export class ComputeSelectorComponent {
  computes = input.required<Compute[]>();
  x = input.required<number>();
  y = input.required<number>();

  private SELECTOR_WIDTH = 260;
  private SELECTOR_HEIGHT = 120; // 估算高度
  private MARGIN = 10;

  @Output() computeSelected = new EventEmitter<string>();

  // 智能定位：计算选择器实际显示位置
  selectorX = computed(() => {
    const mouseX = this.x();
    const screenWidth = window.innerWidth;

    // 如果靠右边边缘，移到左边
    if (mouseX + this.SELECTOR_WIDTH + this.MARGIN > screenWidth) {
      return mouseX - this.SELECTOR_WIDTH - 60; // 移到图标左边
    }
    return mouseX + 60; // 默认在图标右边
  });

  selectorY = computed(() => {
    const mouseY = this.y();
    const screenHeight = window.innerHeight;

    // 如果靠下边边缘，移到上边
    if (mouseY + this.SELECTOR_HEIGHT + this.MARGIN > screenHeight) {
      return mouseY - this.SELECTOR_HEIGHT - 60; // 移到图标上边
    }
    return mouseY + 60; // 默认在图标下边
  });

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

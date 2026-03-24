import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-progress-ring',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './progress-ring.component.html',
  styleUrl: './progress-ring.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressRingComponent {
  /** Percentage value (0-100) */
  percent = input<number>(0);
  /** Label shown below the percentage */
  label = input<string>('');
  /** Radius of the ring */
  radius = input<number>(90);
  /** Stroke width */
  strokeWidth = input<number>(8);
  /** Color for normal state (< 70%) */
  normalColor = input<string>('var(--mat-sys-primary)');
  /** Color for warning state (70-89%) */
  warningColor = input<string>('var(--mat-sys-tertiary)');
  /** Color for error state (>= 90%) */
  errorColor = input<string>('var(--mat-sys-error)');
  /** Track color (background ring) */
  trackColor = input<string>('var(--mat-sys-surface-variant)');

  get strokeDasharray(): number {
    return 2 * Math.PI * this.radius();
  }

  get strokeDashoffset(): number {
    const circumference = this.strokeDasharray;
    const progress = Math.min(100, Math.max(0, this.percent() || 0));
    return circumference - (progress / 100) * circumference;
  }

  get computedColor(): string {
    const p = this.percent() || 0;
    if (p >= 90) return this.errorColor();
    if (p >= 70) return this.warningColor();
    return this.normalColor();
  }
}

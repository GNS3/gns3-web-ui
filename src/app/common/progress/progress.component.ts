import { Component, OnDestroy, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProgressService } from './progress.service';

@Component({
  selector: 'app-progress',
  templateUrl: './progress.component.html',
  styleUrl: './progress.component.scss',
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    RouterLink,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressComponent implements OnInit, OnDestroy {
  private progressService = inject(ProgressService);
  private router = inject(Router);

  visible = signal(false);
  error = signal<any>(null);
  routerSubscription: Subscription;

  ngOnInit() {
    this.progressService.state.subscribe((state) => {
      this.visible.set(state.visible);

      // only set error state once; ignore next "correct" states
      if (state.error && !this.error()) {
        this.error.set(state.error);
      }

      if (state.clear) {
        this.error.set(null);
      }
    });

    // when page changes clear error state
    this.routerSubscription = this.router.events.subscribe(() => {
      this.progressService.clear();
    });
  }

  refresh() {
    this.router.navigateByUrl(this.router.url);
  }

  ngOnDestroy() {
    this.routerSubscription.unsubscribe();
  }
}

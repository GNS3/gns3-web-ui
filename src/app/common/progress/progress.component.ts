import { Component, OnDestroy, OnInit } from '@angular/core';
import { ProgressService } from './progress.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-progress',
  templateUrl: './progress.component.html',
  styleUrls: ['./progress.component.scss']
})
export class ProgressComponent implements OnInit, OnDestroy {
  visible = false;
  error: Error;
  routerSubscription: Subscription;

  constructor(private progressService: ProgressService, private router: Router) {}

  ngOnInit() {
    this.progressService.state.subscribe(state => {
      this.visible = state.visible;

      // only set error state once; ignore next "correct" states
      if (state.error && !this.error) {
        this.error = state.error;
      }

      if (state.clear) {
        this.error = null;
      }
    });

    // when page changes clear error state
    this.routerSubscription = this.router.events.subscribe(() => {
      this.progressService.clear();
    });
  }

  refresh() {
    // unfortunately we need to use global var
    location.reload();
  }

  ngOnDestroy() {
    this.routerSubscription.unsubscribe();
  }
}

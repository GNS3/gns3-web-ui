import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subscription, timer } from 'rxjs';
import { ThemeService } from '../../services/theme.service';

@Component({
    selector: 'app-notification-box',
    templateUrl: './notification-box.component.html',
    styleUrls: ['./notification-box.component.scss']
})
export class NotificationBoxComponent implements OnInit, OnDestroy {
    timer: Observable<number>;
    viewTimer: Observable<number>;
    timerSubscription: Subscription;
    viewTimerSubscription: Subscription;
    viewsCounter = 0;
    ticks = 1000;
    progress = 0;
    isAdLoaded = false;
    isVisible = false;
    interval = 10;

    delayTime = 5000;
    breakTime = 20;
    isEndless = false;
    numberOfViews = 1;
    isLightThemeEnabled = false;

    constructor(
        private themeService: ThemeService
    ) {}

    ngOnInit() {
        this.startTimer();
        this.themeService.getActualTheme() === 'light' ? this.isLightThemeEnabled = true : this.isLightThemeEnabled = false; 
    }

    startTimer() {
        this.timer = timer(this.delayTime, 1000);

        this.timerSubscription = this.timer.subscribe(() => {
            this.ticks++;
            if (this.ticks > this.breakTime && !this.isVisible && navigator.onLine && this.isAdLoaded) {
                this.ticks = 0;
                this.showNotification();
                this.viewsCounter++;
                if (!this.isEndless) {
                    if (this.viewsCounter === this.numberOfViews) {
                        this.timerSubscription.unsubscribe();
                    }
                }
            }
        });
    }

    onLoadingAdbutler(event) {
        this.isAdLoaded = event;
    }

    showNotification() {
        this.viewTimer = timer(0, 100);
        this.progress = 0;
        this.isVisible = true;
        this.viewTimerSubscription = this.viewTimer.subscribe(() => {
            this.progress += 1;
            if (this.progress > 100) {
                this.isVisible = false;
                this.viewTimerSubscription.unsubscribe();
            }
        });
    }

    closeNotification() {
        this.isVisible = false;
    }

    ngOnDestroy() {
        this.timerSubscription.unsubscribe();
        this.viewTimerSubscription.unsubscribe();
    }
}

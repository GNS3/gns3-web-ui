import { Component, OnInit, OnDestroy } from '@angular/core';
import { timer, interval, Observable, Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { NotificationSettingsService } from '../../services/notification-settings.service';
import { NotificationSettings } from '../../models/notification-settings-models/notification-settings';

@Component({
    selector: 'app-notification-box',
    templateUrl: './notification-box.component.html',
    styleUrls: ['./notification-box.component.scss']
})
export class NotificationBoxComponent implements OnInit, OnDestroy {
    notificationSettings: NotificationSettings;
    timer: Observable<number>;
    timerSubscription: Subscription;
    intervalSubscription: Subscription;
    viewsCounter = 0;
    ticks: number = 1000;
    progress: number = 0;
    isVisible = false;
    interval = 10;

    constructor(
        private notifactionSettingsService: NotificationSettingsService
    ){}

    ngOnInit() {
        this.notificationSettings = this.notifactionSettingsService.getConfiguration();
        this.startTimer();
    }

    startTimer() {
        this.timer = timer(this.notificationSettings.delayTime, 1000);

        this.timerSubscription = this.timer.subscribe(() => {
            this.ticks++;
            if (this.ticks > this.notificationSettings.breakTime && navigator.onLine) {
                this.ticks = 0;
                this.showNotification();
                this.viewsCounter++;
                if (!this.notificationSettings.isEndless){
                    if (this.viewsCounter === this.notificationSettings.numberOfViews) {
                        this.timerSubscription.unsubscribe();
                    }
                }
            }
        });
    }

    showNotification() {
        this.isVisible = true;
        this.progress = 0;

        this.intervalSubscription = interval(this.interval).pipe(take(this.notificationSettings.viewTime)).subscribe(() => {
            this.progress += (1/this.interval);
            if (this.progress > ((this.notificationSettings.viewTime/this.interval)-(1/this.interval))) {
                this.isVisible = false;
                this.intervalSubscription.unsubscribe();
            }
        });
    }

    closeNotification() {
        this.isVisible = false;
    }

    ngOnDestroy() {
        this.timerSubscription.unsubscribe();
    }
}

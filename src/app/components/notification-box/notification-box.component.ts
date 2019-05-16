import { Component, OnInit } from '@angular/core';
import { timer, interval, Observable } from 'rxjs';
import { take } from 'rxjs/operators';

@Component({
    selector: 'app-notification-box',
    templateUrl: './notification-box.component.html',
    styleUrls: ['./notification-box.component.scss']
})
export class NotificationBoxComponent implements OnInit {
    timer: Observable<number>;
    ticks: number = 0;

    isVisible = true;
    progress : number = 0;

    initialTime = 1000;
    showTime = 1000;
    breakTime = 10;
    interval = 10;

    constructor(){}

    ngOnInit(){
        this.timer = timer(this.initialTime, 1000);

        this.timer.subscribe(() => {
            this.ticks++;
            if (this.ticks > this.breakTime) {
                this.ticks = 0;
                this.showNotification();
            }
        });
    }

    showNotification() {
        this.isVisible = true;
        this.progress = 0;

        interval(this.interval).pipe(take(this.showTime)).subscribe(() => {
            this.progress += (1/this.interval);
            if (this.progress > ((this.showTime/this.interval)-(1/this.interval))) {
                this.isVisible = false;
            }
        });
    }

    closeNotification(){
        this.isVisible = false;
    }
}

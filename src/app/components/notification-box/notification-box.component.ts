import { Component, OnInit, OnDestroy, ComponentFactoryResolver, ViewContainerRef, ViewChild } from '@angular/core';
import { timer, Observable, Subscription } from 'rxjs';
import { ThemeService } from '../../services/theme.service';
import { AdbutlerComponent } from '../adbutler/adbutler.component';

@Component({
    selector: 'app-notification-box',
    templateUrl: './notification-box.component.html',
    styleUrls: ['./notification-box.component.scss']
})
export class NotificationBoxComponent implements OnInit, OnDestroy {
    @ViewChild('dynamicComponentContainer', {read: ViewContainerRef, static: false}) dynamicComponentContainer;

    timer: Observable<number>;
    viewTimer: Observable<number>;
    timerSubscription: Subscription;
    viewTimerSubscription: Subscription;
    viewsCounter = 0;
    ticks: number = 1000;
    progress: number = 0;
    isAdLoaded = false;
    isVisible = false;
    interval = 10;

    delayTime: number = 5000;
    breakTime: number = 20;
    isEndless: boolean = false;
    numberOfViews: number = 1;
    isLightThemeEnabled: boolean = false;

    constructor(
        private themeService: ThemeService,
        private componentFactoryResolver: ComponentFactoryResolver,
        private viewContainerRef: ViewContainerRef
    ){}

    ngOnInit() {
        this.startTimer();
        this.themeService.getActualTheme() === 'light' ? this.isLightThemeEnabled = true : this.isLightThemeEnabled = false; 
    }

    ngAfterViewInit() {
        this.createDynamicAdComponent();
    }

    createDynamicAdComponent() : void {
        const factory = this.componentFactoryResolver.resolveComponentFactory(AdbutlerComponent);
        const componentRef = this.dynamicComponentContainer.createComponent(factory);
        componentRef.instance.theme = this.themeService.getActualTheme() === 'light';
        componentRef.instance.onLoad.subscribe(event => {
            this.onLoadingAdbutler(event);
        })
        componentRef.changeDetectorRef.detectChanges();
    }

    startTimer() {
        this.timer = timer(this.delayTime, 1000);

        this.timerSubscription = this.timer.subscribe(() => {
            this.ticks++;
            if (this.ticks > this.breakTime && !this.isVisible && navigator.onLine && this.isAdLoaded) {
                this.ticks = 0;
                this.showNotification();
                this.viewsCounter++;
                if (!this.isEndless){
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

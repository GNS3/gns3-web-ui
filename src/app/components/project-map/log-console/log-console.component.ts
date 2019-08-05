import { Component, OnInit, AfterViewInit, OnDestroy, Input, ViewChild, ElementRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { ProjectWebServiceHandler } from '../../../handlers/project-web-service-handler';


@Component({
    selector: 'app-log-console',
    templateUrl: './log-console.component.html',
    styleUrls: ['./log-console.component.scss']
})
export class LogConsoleComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('console', {static: false}) console: ElementRef;
    private subscription: Subscription;
    command: string = '';

    constructor(
        private projectWebServiceHandler: ProjectWebServiceHandler
    ) {}
    
    ngOnInit() {
        this.subscription = this.projectWebServiceHandler.logEmitter.subscribe((event) => {
            let message = `Event received: ${event.action}.`
            this.showMessage(message);
        })
    }

    ngAfterViewInit() {
        this.console.nativeElement.scrollTop = this.console.nativeElement.scrollHeight;
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    onKeyDown(event) {
        if (event.key === "Enter") {
          this.handleCommand();
        }
    }

    handleCommand() {
        if (this.command === 'start all') {
            this.showMessage("Starting all nodes...");
        } else {
            this.showMessage(`Unknown syntax: ${this.command}`);
        }
        this.command = '';
    }

    showMessage(message: string) {
        this.console.nativeElement.innerHTML += message += "<br />";
        this.console.nativeElement.scrollTop = this.console.nativeElement.scrollHeight;
    }
}

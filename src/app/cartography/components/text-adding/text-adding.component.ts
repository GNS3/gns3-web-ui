import { Component, OnInit, OnDestroy } from "@angular/core";
import { select } from 'd3-selection';
import { Context } from "../../models/context";
import { TextAddingTool } from '../../tools/text-adding-tool';
import { Subscription } from 'rxjs';
import { DrawingsEventSource } from '../../events/drawings-event-source';
import { TextAddedDataEvent } from '../../events/event-source';

@Component({
    selector: 'app-text-adding',
    template: `<ng-content></ng-content>`,
    styleUrls: ['./text-adding.component.scss']
})
export class TextAddingComponent implements OnInit, OnDestroy {
    textAddingFinished: Subscription;

    constructor(
        private textAddingTool: TextAddingTool,
        private drawingEventSource: DrawingsEventSource
    ){}

    ngOnInit() {
        this.textAddingFinished = this.textAddingTool.addingFinished.subscribe((evt: TextAddedDataEvent) => {
            this.drawingEventSource.textAdded.emit(evt);
        })
    }

    ngOnDestroy() {
        this.textAddingFinished.unsubscribe();
    }
}

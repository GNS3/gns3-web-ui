import { Component, OnDestroy, OnInit } from "@angular/core";
import { Subscription } from 'rxjs';
import { TextEditingTool } from '../../tools/text-editing-tool';
import { DrawingsEventSource } from '../../events/drawings-event-source';
import { TextEditedDataEvent } from '../../events/event-source';

@Component({
    selector: 'app-text-editing',
    template: `<ng-content></ng-content>`,
    styleUrls: ['./text-editing.component.scss']
})
export class TextEditingComponent implements OnInit, OnDestroy {
    textEditingFinished: Subscription;

    constructor(
        private textEditingTool: TextEditingTool,
        private drawingEventSource: DrawingsEventSource
    ) {}

    ngOnInit() {
        this.textEditingFinished = this.textEditingTool.editingFinished.subscribe((evt: TextEditedDataEvent) => {
            this.drawingEventSource.textEdited.emit(evt);
        });
    }

    ngOnDestroy() {
        this.textEditingFinished.unsubscribe();
    }
}

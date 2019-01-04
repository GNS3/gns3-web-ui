import { Component, ViewChild, ElementRef, OnInit, Input, EventEmitter, OnDestroy } from "@angular/core";
import { DrawingsEventSource } from '../../events/drawings-event-source';
import { TextAddedDataEvent } from '../../events/event-source';
import { ToolsService } from '../../../services/tools.service';
import { SVGSelection } from '../../models/types';
import { Selection, select } from 'd3-selection';
import { TextElement } from '../../models/drawings/text-element';
import { Context } from '../../models/context';

@Component({
    selector: 'app-temporary-text-element',
    templateUrl: './temporary-text-element.component.html',
    styleUrls: ['./temporary-text-element.component.scss']
})
export class TemporaryTextElementComponent implements OnInit, OnDestroy {
    @ViewChild('temporaryTextElement') temporaryTextElement: ElementRef;
    @Input('svg') svg: SVGSVGElement;

    private leftPosition: string = '0px';
    private topPosition: string = '0px';
    private innerText: string = '';
    private isActive: boolean = false;
    private mapListener: Function;
    private textListener: Function;
    public addingFinished = new EventEmitter<any>();

    private enabled = true;
    private editingDrawingId: string;
    private editedElement: any;
    private temporaryElement: HTMLDivElement;
    
    constructor(
        private drawingsEventSource: DrawingsEventSource,
        private toolsService: ToolsService,
        private context: Context
    ){}

    ngOnInit(){
        this.toolsService.isTextAddingToolActivated.subscribe((isActive: boolean) => {
            this.isActive = isActive;
            isActive ? this.activate() : this.deactivate()
        });

        this.activateTextEditing();
    }

    activate(){
        let addTextListener = (event: MouseEvent) => {
            this.leftPosition = event.clientX.toString() + 'px';
            this.topPosition = event.clientY.toString() + 'px';
            this.temporaryTextElement.nativeElement.focus();

            let textListener = () => {
                this.drawingsEventSource.textAdded.emit(new TextAddedDataEvent(this.temporaryTextElement.nativeElement.innerText.replace(/\n$/, ""), event.clientX, event.clientY));
                this.deactivate();
                this.temporaryTextElement.nativeElement.removeEventListener('focusout', this.textListener);
                this.isActive = false;
            }
            this.textListener = textListener;
            this.temporaryTextElement.nativeElement.addEventListener('focusout', this.textListener);
        }

        this.deactivate();
        this.mapListener = addTextListener;
        this.svg.addEventListener('click', this.mapListener as EventListenerOrEventListenerObject);
    }

    deactivate(){
        this.svg.removeEventListener('click', this.mapListener as EventListenerOrEventListenerObject);
    }

    activateTextEditing(){
        const rootElement = select(this.svg);
        console.log("From component ", rootElement.selectAll<SVGTextElement, TextElement>('text.text_element'));

        rootElement.selectAll<SVGTextElement, TextElement>('text.text_element')
            .on("dblclick", (elem, index, textElements) => {
                this.editedElement = elem;
                select(textElements[index])
                    .attr("visibility", "hidden");

                select(textElements[index])
                    .classed("editingMode", true);
            });
    }

    ngOnDestroy(){
        this.toolsService.isTextAddingToolActivated.unsubscribe();
    }
}

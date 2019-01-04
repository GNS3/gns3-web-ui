import { Component, ViewChild, ElementRef, OnInit, Input, EventEmitter, OnDestroy } from "@angular/core";
import { DrawingsEventSource } from '../../events/drawings-event-source';
import { TextAddedDataEvent } from '../../events/event-source';
import { ToolsService } from '../../../services/tools.service';


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
    private isActive: boolean = true;
    private mapListener: Function;
    private textListener: Function;
    public addingFinished = new EventEmitter<any>();
    
    constructor(
        private drawingsEventSource: DrawingsEventSource,
        private toolsService: ToolsService
    ){}

    ngOnInit(){
        this.toolsService.isTextAddingToolActivated.subscribe((isActive: boolean) => {
            this.isActive = isActive;
            isActive ? this.activate() : this.decativate()
        });
    }

    activate(){
        let addTextListener = (event: MouseEvent) => {
            this.leftPosition = event.clientX.toString() + 'px';
            this.topPosition = event.clientY.toString() + 'px';

            this.temporaryTextElement.nativeElement.focus();

            let textListener = () => {
                this.drawingsEventSource.textAdded.emit(new TextAddedDataEvent(this.temporaryTextElement.nativeElement.innerText.replace(/\n$/, ""), event.clientX, event.clientY));
                this.svg.removeEventListener('click', this.mapListener as EventListenerOrEventListenerObject);
                this.temporaryTextElement.nativeElement.removeEventListener('focusout', this.textListener);
                this.isActive = false;
            }
            this.textListener = textListener;
            this.temporaryTextElement.nativeElement.addEventListener('focusout', this.textListener);
        }

        this.mapListener = addTextListener;
        this.svg.addEventListener('click', this.mapListener as EventListenerOrEventListenerObject);
    }

    decativate(){
        this.svg.removeEventListener('click', this.mapListener as EventListenerOrEventListenerObject);
    }

    ngOnDestroy(){
        this.toolsService.isTextAddingToolActivated.unsubscribe();
    }
}

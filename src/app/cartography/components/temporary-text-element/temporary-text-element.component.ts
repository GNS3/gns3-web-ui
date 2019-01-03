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

    //should cover all style variables that can change
    private leftPosition: string;
    private topPosition: string;
    private innerText: string;
    private isActive: boolean = true;
    private mapListener: Function;
    private textListener: Function;
    public addingFinished = new EventEmitter<any>();
    
    constructor(
        private drawingsEventSource: DrawingsEventSource,
        private toolsService: ToolsService
    ){
        this.leftPosition = '100px';
        this.topPosition = '100px';
        this.innerText = '';
    }

    ngOnInit(){
        this.toolsService.isTextAddingToolActivated.subscribe((isActive: boolean) => {
            isActive ? this.activate() : this.decativate()
        });
    }

    activate(){
        let addTextListener = (event: MouseEvent) => {
            this.leftPosition = event.clientX.toString() + 'px';
            this.topPosition = event.clientY.toString() + 'px';

            this.temporaryTextElement.nativeElement.focus();

            let textListener = () => {
                console.log("textListener: ", this.innerText);
                this.drawingsEventSource.textAdded.emit(new TextAddedDataEvent(this.innerText.replace(/\n$/, ""), event.clientX, event.clientY));
                this.svg.removeEventListener('click', this.mapListener as EventListenerOrEventListenerObject);
                this.temporaryTextElement.nativeElement.removeEventListener('focusout', this.textListener);
                this.innerText = '';
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

    }
}

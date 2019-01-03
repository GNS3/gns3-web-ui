import { Injectable, EventEmitter } from "@angular/core";
import { TextAddedDataEvent } from '../events/event-source';
import { DrawingsEventSource } from '../events/drawings-event-source';


@Injectable()
export class TextAddingTool {
    private listener: Function;
    private temporaryElement: HTMLDivElement;
    public addingFinished = new EventEmitter<any>();

    constructor(
        private drawingEventSource: DrawingsEventSource,
    ){}

    public setEnabled(enabled){
        // if (enabled){
        //     this.activate();
        // } else {
        //     this.deactivate();
        // }
    }

    private deactivate(){
        var map = document.getElementsByClassName('map')[0];
        map.removeEventListener('click', this.listener as EventListenerOrEventListenerObject);
    }

    private activate(){
        var map = document.getElementsByClassName('map')[0];

        let addTextListener = (event: MouseEvent) => {
            this.temporaryElement = this.getTemporaryElement(event.clientX, event.clientY);
            document.body.appendChild(this.temporaryElement);
            this.temporaryElement.focus();
            document.body.style.cursor = "text";
    
            this.temporaryElement.addEventListener("focusout", () => {
                let innerText = this.temporaryElement.innerText;                
                this.addingFinished.emit(new TextAddedDataEvent(innerText.replace(/\n$/, ""), event.clientX, event.clientY));

                this.drawingEventSource.textSaved.subscribe((evt:boolean) => {
                    if(evt){
                        this.temporaryElement.remove();
                        document.body.style.cursor = "default";
                    }
                });
            });
        }

        map.removeEventListener('click', this.listener as EventListenerOrEventListenerObject);
        this.listener = addTextListener;
        map.addEventListener('click', this.listener as EventListenerOrEventListenerObject, {once : true});
    }

    private getTemporaryElement(x:number, y:number): HTMLDivElement{
        var elem = document.createElement('div');
        elem.className = "temporaryElement";
        elem.style.paddingLeft = "4px";
        elem.style.width = "fit-content";
        elem.style.left = x.toString() + 'px';
        elem.style.top = y.toString() + 'px';
        elem.style.position = "absolute";
        elem.style.zIndex = "99";
        elem.style.fontFamily = "Noto Sans";
        elem.style.fontSize = "11pt";
        elem.style.fontWeight = "bold";
        elem.style.color = "#000000";
        elem.setAttribute("contenteditable", "true");
        elem.innerText = "";

        return elem;
    }
}

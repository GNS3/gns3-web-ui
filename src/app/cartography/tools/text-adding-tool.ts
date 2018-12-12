import { Injectable, EventEmitter } from "@angular/core";
import { TextAddedDataEvent } from '../events/event-source';


@Injectable()
export class TextAddingTool {
    private enabled;
    private listener: Function;
    public addingFinished = new EventEmitter<any>();

    public setEnabled(enabled){
        this.enabled = enabled;
        if (enabled){
            this.activate();
        } else {
            this.deactivate();
        }
    }

    private deactivate(){
        var map = document.getElementsByClassName('map')[0];
        map.removeEventListener('click', this.listener as EventListenerOrEventListenerObject);
    }

    private activate(){
        var map = document.getElementsByClassName('map')[0];

        let addTextListener = (event: MouseEvent) => {
    
            var div = document.createElement('div');
            div.style.width = "fit-content";
            div.style.left = event.clientX.toString() + 'px';
            div.style.top = (event.clientY).toString() + 'px';
            div.style.position = "absolute";
            div.style.zIndex = "99";
    
            div.style.fontFamily = "Noto Sans";
            div.style.fontSize = "11pt";
            div.style.fontWeight = "bold";
            div.style.color = "#000000";
    
            div.setAttribute("contenteditable", "true");
    
            document.body.appendChild(div);
            div.innerText = "";
            div.focus();
            document.body.style.cursor = "text";
    
            div.addEventListener("focusout", () => {
                let savedText = div.innerText;
                this.addingFinished.emit(new TextAddedDataEvent(savedText, event.clientX, event.clientY));

                document.body.style.cursor = "default";
                div.remove();
            });
        }

        map.removeEventListener('click', this.listener as EventListenerOrEventListenerObject);
        this.listener = addTextListener;
        map.addEventListener('click', this.listener as EventListenerOrEventListenerObject, {once : true});
    }   
}

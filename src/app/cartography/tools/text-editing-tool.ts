import { Injectable, EventEmitter } from "@angular/core";
import { SVGSelection } from '../models/types';
import { select } from 'd3-selection';
import { TextElement } from '../models/drawings/text-element';
import { TextEditedDataEvent } from '../events/event-source';
import { DrawingsEventSource } from '../events/drawings-event-source';


@Injectable()
export class TextEditingTool {
    private enabled = true;
    private editingDrawingId: string;
    private editedElement: any;
    private temporaryElement: HTMLDivElement;
    public editingFinished = new EventEmitter<any>();

    constructor(
        private drawingEventSource: DrawingsEventSource
    ){}

    public setEnabled(enabled) {
        this.enabled = enabled;
    }

    public draw(selection: SVGSelection){
        if (!this.enabled){
            return;
        }

        selection.selectAll<SVGTextElement, TextElement>('text.text_element')
            .on("dblclick", (elem, index, textElements) => {

            this.editedElement = elem;
            
            select(textElements[index])
                .attr("visibility", "hidden");

            select(textElements[index])
                .classed("editingMode", true);

            this.editingDrawingId = textElements[index].parentElement.parentElement.getAttribute("drawing_id");

            var splitted = textElements[index].parentElement.getAttribute("transform").split(/\(|\)/);
            var x = Number(splitted[1].split(/,/)[0]);
            var y = Number(splitted[1].split(/,/)[1]);
            console.log(x);
            console.log(y);

            this.temporaryElement = document.createElement('div');
            this.temporaryElement.style.width = "fit-content";
            this.temporaryElement.style.left = '100px';//x.toString() + 'px';
            this.temporaryElement.style.top = '100px';//y.toString() + 'px';
            this.temporaryElement.style.position = "absolute";
            this.temporaryElement.style.zIndex = "99";
            this.temporaryElement.style.fontFamily = elem.font_family;
            this.temporaryElement.style.fontSize = `${elem.font_size}pt`;
            this.temporaryElement.style.fontWeight = elem.font_weight;
            this.temporaryElement.style.color = elem.fill;     
            this.temporaryElement.style.textDecoration = elem.text_decoration;
            this.temporaryElement.setAttribute("contenteditable", "true");
            this.temporaryElement.innerText = elem.text;

            this.temporaryElement.addEventListener("focusout", () => {
                let savedText = this.temporaryElement.innerText;
                this.editingFinished.emit(new TextEditedDataEvent(this.editingDrawingId, savedText, this.editedElement));

                this.drawingEventSource.textSaved.subscribe((evt:boolean) => {
                    if(evt){
                        this.temporaryElement.remove();
                        document.body.style.cursor = "default";
                    }
                });

                selection.selectAll<SVGTextElement, TextElement>('text.editingMode')
                    .attr("visibility", "visible")
                    .classed("editingMode", false);
            });

            document.body.appendChild(this.temporaryElement);
            this.temporaryElement.focus();
        });
    }
}

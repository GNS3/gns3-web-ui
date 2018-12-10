import { Injectable, EventEmitter } from "@angular/core";
import { SVGSelection } from '../models/types';
import { select } from 'd3-selection';
import { TextElement } from '../models/drawings/text-element';
import { TextEditedDataEvent } from '../events/event-source';


@Injectable()
export class TextEditingTool {
    private enabled = true;
    private editingDrawingId: string;
    private editedElement: any;
    public editingFinished = new EventEmitter<any>();

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
            //simply get canvas
            select(textElements[index].parentElement.parentElement.parentElement)
                .append("foreignObject")
                .attr("width", '1000px')
                .attr("min-width", 'fit-content')
                .attr("height", '100px')
                .attr("id", "temporaryText")
                .attr("transform", textElements[index].parentElement.getAttribute("transform"))
                .append("xhtml:div")
                .attr("width", "fit-content")
                .attr("height", "fit-content")
                .attr("class", "temporaryTextInside")
                .attr('style', () => {
                    const styles: string[] = [];
                    styles.push(`white-space: pre-line`)
                    styles.push(`outline: 0px solid transparent`)
                    styles.push(`font-family: ${elem.font_family}`)
                    styles.push(`font-size: ${elem.font_size}pt!important`);
                    styles.push(`font-weight: ${elem.font_weight}`)
                    styles.push(`color: ${elem.fill}`);
                    return styles.join("; ");
                })
                .attr('text-decoration', elem.text_decoration)
                .attr('contenteditable', 'true')
                .text(elem.text)
                .on("focusout", () => {
                    let temporaryText = document.getElementsByClassName("temporaryTextInside")[0] as HTMLElement;
                    let savedText = temporaryText.innerText;
                    this.editingFinished.emit(new TextEditedDataEvent(this.editingDrawingId, savedText, this.editedElement));

                    var temporaryElement = document.getElementById("temporaryText") as HTMLElement;
                    temporaryElement.remove();

                    selection.selectAll<SVGTextElement, TextElement>('text.editingMode')
                        .attr("visibility", "visible")
                        .classed("editingMode", false);
                });

            var txtInside = document.getElementsByClassName("temporaryTextInside")[0] as HTMLElement;
            txtInside.focus();
        });
    }
}

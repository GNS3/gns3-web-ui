import { Component, OnInit } from "@angular/core";
import { select } from 'd3-selection';
import { Context } from "../../models/context";

@Component({
    selector: 'app-text-adding',
    template: `<ng-content></ng-content>`,
    styleUrls: ['./text-adding.component.scss']
})
export class TextAddingComponent implements OnInit {
    public isEnabled: boolean = true;

    constructor(
        private context: Context
    ){}

    ngOnInit(){

    }

    addingTextSelected(){


        //let x = event.clientX - this.mapChild.context.getZeroZeroTransformationPoint().x;
        //let y = event.clientY - this.mapChild.context.getZeroZeroTransformationPoint().y;

        const svgElement = select("g.canvas");
        svgElement
          .append("foreignObject")
            .attr("id", "temporaryText")
            .attr("transform", `translate(${x},${y}) rotate(0)`)
            .attr("width", '1000px')
          .append("xhtml:div")
            .attr("class", "temporaryTextInside")
            .attr('style', () => {
              const styles: string[] = [];
              styles.push(`font-family: Noto Sans`)
              styles.push(`font-size: 11pt`);
              styles.push(`font-weight: bold`)
              styles.push(`color: #000000`);
              return styles.join("; ");
            })
            .attr("width", 'fit-content')
            .attr("height", 'max-content')
            .attr('contenteditable', 'true')
            .text("")
            .on("focusout", () => {
              let elem = document.getElementsByClassName("temporaryTextInside")[0] as HTMLElement;
              let savedText = elem.innerText;

            //   let drawing = this.getDrawingMock("text", savedText);
            //   (drawing.element as TextElement).text = savedText;
            //   let svgText = this.mapDrawingToSvgConverter.convert(drawing);

            //   this.drawingService
            //     .add(this.server, this.project.project_id, x, y, svgText)
            //     .subscribe((serverDrawing: Drawing) => {
            //      var temporaryElement = document.getElementById("temporaryText") as HTMLElement;
            //      temporaryElement.remove();
            //       this.drawingsDataSource.add(serverDrawing);
            //     });
            });
    }
}

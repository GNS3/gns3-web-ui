import { Component, Input, OnChanges, SimpleChange, Output, EventEmitter } from "@angular/core";
import { DrawingsDataSource } from '../../../cartography/datasources/drawings-datasource';
import { DrawingService } from '../../../services/drawing.service';
import { DrawingsFactory } from '../../../cartography/helpers/drawings-factory';
import { MapDrawingToSvgConverter } from '../../../cartography/converters/map/map-drawing-to-svg-converter';
import { Project } from '../../../models/project';
import { Server } from '../../../models/server';
import { MapDrawing } from '../../../cartography/models/map/map-drawing';
import { Drawing } from '../../../cartography/models/drawing';
import { Context } from '../../../cartography/models/context';
import { TextElement } from '../../../cartography/models/drawings/text-element';


@Component({
    selector: 'app-add-drawing',
    templateUrl: './add-drawing.component.html',
    styleUrls: ['./add-drawing.component.css']
})
export class AddDrawingComponent implements OnChanges {
    @Input() project: Project;
    @Input() server: Server;
    @Input() selectedDrawing: string;
    @Output() drawingSaved = new EventEmitter<boolean>();
    private readonly availableDrawings = ['rectangle', 'ellipse', 'line'];
    public drawListener: Function;

    constructor(
        private drawingService: DrawingService,
        private drawingsDataSource: DrawingsDataSource,
        private drawingsFactory: DrawingsFactory,
        private mapDrawingToSvgConverter: MapDrawingToSvgConverter,
        private context: Context
    ){}

    ngOnChanges(changes: { [propKey: string]: SimpleChange }) {
        if(changes['selectedDrawing'] && !changes['selectedDrawing'].isFirstChange()){
            if(this.availableDrawings.includes(changes['selectedDrawing'].currentValue)){
                this.addDrawing(changes['selectedDrawing'].currentValue);
            } else if (changes['selectedDrawing'].currentValue === "text") {
                this.addText();
            } else {
                document.getElementsByClassName('map')[0].removeEventListener('click', this.drawListener as EventListenerOrEventListenerObject);
            }
        }
    }

    addDrawing(selectedObject: string){
        let mapDrawing: MapDrawing = this.drawingsFactory.getDrawingMock(selectedObject);
    
        let listener = (event: MouseEvent) => {
          let x = event.clientX - this.context.getZeroZeroTransformationPoint().x;
          let y = event.clientY - this.context.getZeroZeroTransformationPoint().y;
          let svg = this.mapDrawingToSvgConverter.convert(mapDrawing);
    
          this.drawingService
            .add(this.server, this.project.project_id, x, y, svg)
            .subscribe((serverDrawing: Drawing) => {
              this.drawingsDataSource.add(serverDrawing);
              this.drawingSaved.emit(true);
            });
        }
    
        let map = document.getElementsByClassName('map')[0];
        map.removeEventListener('click', this.drawListener as EventListenerOrEventListenerObject);
        this.drawListener = listener;
        map.addEventListener('click', this.drawListener as EventListenerOrEventListenerObject, {once : true});
    }

    addText(){
        let addTextListener = (event: MouseEvent) => {
          let textBox = document.createElement('div');
          textBox.style.width = "fit-content";
          textBox.style.left = event.clientX.toString() + 'px';
          textBox.style.top = (event.clientY - 10).toString() + 'px';
          textBox.style.position = "absolute";
          textBox.style.zIndex = "99";
  
          textBox.style.fontFamily = "Noto Sans";
          textBox.style.fontSize = "11pt";
          textBox.style.fontWeight = "bold";
          textBox.style.color = "#000000";
  
          textBox.setAttribute("contenteditable", "true");
  
          document.body.appendChild(textBox);
          textBox.innerText = "";
          textBox.focus();
          document.body.style.cursor = "text";
  
          textBox.addEventListener("focusout", () => {
            let savedText = textBox.innerText;
  
            let drawing = this.drawingsFactory.getDrawingMock("text");
            (drawing.element as TextElement).text = savedText;
            let svgText = this.mapDrawingToSvgConverter.convert(drawing);
  
            this.drawingService
              .add(this.server, this.project.project_id, event.clientX - this.context.getZeroZeroTransformationPoint().x, event.clientY - this.context.getZeroZeroTransformationPoint().y, svgText)
              .subscribe((serverDrawing: Drawing) => {
                document.body.style.cursor = "default";
                textBox.remove();

                this.drawingsDataSource.add(serverDrawing);
                this.drawingSaved.emit(true);
              });
          });
        }

        let map = document.getElementsByClassName('map')[0];
        map.removeEventListener('click', this.drawListener as EventListenerOrEventListenerObject);
        this.drawListener = addTextListener;
        map.addEventListener('click', this.drawListener as EventListenerOrEventListenerObject, {once : true});
    }
}

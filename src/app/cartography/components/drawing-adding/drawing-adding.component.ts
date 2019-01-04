import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { Context } from '../../models/context';
import { DefaultDrawingsFactory } from '../../helpers/default-drawings-factory';
import { MapDrawingToSvgConverter } from '../../converters/map/map-drawing-to-svg-converter';
import { MapDrawing } from '../../models/map/map-drawing';
import { ToolsService } from '../../../services/tools.service';


@Component({
    selector: 'app-drawing-adding',
    templateUrl: './drawing-adding.component.html',
    styleUrls: ['./drawing-adding.component.scss']
})
export class DrawingAddingComponent implements OnInit, OnDestroy {
    @Input('svg') svg: SVGSVGElement;

    private readonly availableDrawings = ['rectangle', 'ellipse', 'line'];
    private mapListener: Function;

    constructor(
        private toolsService: ToolsService,
        private drawingsFactory: DefaultDrawingsFactory,
        private mapDrawingToSvgConverter: MapDrawingToSvgConverter,
        private context: Context
    ){}

    ngOnInit(){
        
    }

    activate(selectedObject: string){
        let mapDrawing: MapDrawing = this.drawingsFactory.getDrawingMock(selectedObject);
        
        let listener = (event: MouseEvent) => {
            let x = event.clientX - this.context.getZeroZeroTransformationPoint().x;
            let y = event.clientY - this.context.getZeroZeroTransformationPoint().y;
            let svg = this.mapDrawingToSvgConverter.convert(mapDrawing);
      
            // this.drawingService
            //   .add(this.server, this.project.project_id, x, y, svg)
            //   .subscribe((serverDrawing: Drawing) => {
            //     this.drawingsDataSource.add(serverDrawing);
            //     this.drawingSaved.emit(true);
            //   });

            this.deactivate();
        };

        this.deactivate();
        this.mapListener = listener;
        this.svg.addEventListener('click', this.mapListener as EventListenerOrEventListenerObject);
    }

    deactivate(){
        this.svg.removeEventListener('click', this.mapListener as EventListenerOrEventListenerObject);
    }

    ngOnDestroy(){

    }
}

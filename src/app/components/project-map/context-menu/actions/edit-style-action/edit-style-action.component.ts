import { Component, OnInit, Input } from "@angular/core";
import { Drawing } from '../../../../../cartography/models/drawing';
import { Server } from '../../../../../models/server';
import { DrawingsDataSource } from '../../../../../cartography/datasources/drawings-datasource';
import { DrawingService } from '../../../../../services/drawing.service';


@Component({
    selector: 'app-edit-style-action',
    templateUrl: './edit-style-action.component.html'
})
export class EditStyleActionComponent implements OnInit {
    @Input() server: Server;
    @Input() drawing: Drawing;

    constructor(
        private drawingsDataSource: DrawingsDataSource,
        private drawingService: DrawingService
    ) {}

    ngOnInit() {}

    editStyle(){}
}

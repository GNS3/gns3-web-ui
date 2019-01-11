import { Component, OnInit } from "@angular/core";
import { Project } from '../../../../models/project';
import { Drawing } from '../../../../cartography/models/drawing';
import { Server } from '../../../../models/server';


@Component({
    selector: 'app-text-editor',
    templateUrl: './text-editor.component.html',
    styleUrls: ['./text-editor.component.scss']
})
export class TextEditorDialogComponent implements OnInit {
    server: Server;
    project: Project;
    drawing: Drawing;

    constructor(){}

    ngOnInit(){}
}

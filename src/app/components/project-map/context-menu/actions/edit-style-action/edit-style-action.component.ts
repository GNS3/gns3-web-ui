import { Component, OnInit, Input } from "@angular/core";
import { Drawing } from '../../../../../cartography/models/drawing';
import { Server } from '../../../../../models/server';
import { MatDialog } from '@angular/material';
import { Project } from '../../../../../models/project';
import { TextElement } from '../../../../../cartography/models/drawings/text-element';
import { StyleEditorDialogComponent } from '../../../drawings-editors/style-editor/style-editor.component';
import { TextEditorDialogComponent } from '../../../drawings-editors/text-editor/text-editor.component';


@Component({
    selector: 'app-edit-style-action',
    templateUrl: './edit-style-action.component.html'
})
export class EditStyleActionComponent implements OnInit {
    @Input() server: Server;
    @Input() project: Project;
    @Input() drawing: Drawing;

    constructor(
        private dialog: MatDialog
    ) {}

    ngOnInit() {}

    editStyle() {
        this.drawing.element instanceof TextElement ? this.openTextEditor() : this.openStyleEditor(); 
    }

    openStyleEditor() {
        const dialogRef = this.dialog.open(StyleEditorDialogComponent, {
            width: '550px',
        });
        let instance = dialogRef.componentInstance;
        instance.server = this.server;
        instance.project = this.project;
        instance.drawing = this.drawing;
    }

    openTextEditor() {
        const dialogRef = this.dialog.open(TextEditorDialogComponent, {
            width: '550px',
        });
        let instance = dialogRef.componentInstance;
        instance.server = this.server;
        instance.project = this.project;
        instance.drawing = this.drawing;
    }
}

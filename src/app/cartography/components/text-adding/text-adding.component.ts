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
        //here will be moved addText in projectMapComponent
    }
}

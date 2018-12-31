import { Injectable } from "@angular/core";
import { Subject } from 'rxjs';

@Injectable()
export class ToolsService {
    isSelectionToolActivated = new Subject<boolean>();
    isMovingToolActivated = new Subject<boolean>();
    isTextEditingToolActivated = new Subject<boolean>();
    isTextAddingToolActivated = new Subject<boolean>();
    isDrawLinkToolActivated = new Subject<boolean>();

    constructor(){}

    selectionToolActivation(value: boolean){
        this.isSelectionToolActivated.next(value);
    }

    movingToolActivation(value: boolean){
        this.isMovingToolActivated.next(value);
    }

    textEditingToolActivation(value: boolean){
        this.isTextEditingToolActivated.next(value);
    }

    textAddingToolActivation(value: boolean){
        this.isTextAddingToolActivated.next(value);
    }

    drawLinkToolActivation(value: boolean){
        this.isDrawLinkToolActivated.next(value);
    }
}

import { Injectable, EventEmitter } from "@angular/core";


@Injectable()
export class TextEditingTool {
    static readonly EDITING_CLASS = '.text-editing';

    private enabled = true;
    public editingFinished = new EventEmitter<any>();

    public setEnabled(enabled) {
        this.enabled = enabled;
    }

    public activate(){

    }
}

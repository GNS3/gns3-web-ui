import { Injectable, EventEmitter } from '@angular/core';

@Injectable()
export class MapScaleService {
    public currentScale: number;
    public scaleChangeEmitter = new EventEmitter();

    constructor() {
        this.currentScale = 1;
    }

    getScale() {
        return this.currentScale;
    }

    setScale(newScale: number) {
        this.currentScale = newScale;
        this.scaleChangeEmitter.emit();
    }

    resetToDefault() {
        this.currentScale = 1;
        this.scaleChangeEmitter.emit();
    }
}

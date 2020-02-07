import { EventEmitter, Injectable } from "@angular/core";

@Injectable()
export class MovingEventSource {
    public movingModeState = new EventEmitter<boolean>();
}

import { Injectable, EventEmitter } from '@angular/core';

@Injectable()
export class MovingEventSource {
  public movingModeState = new EventEmitter<boolean>();
}

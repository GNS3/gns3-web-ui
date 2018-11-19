import { Injectable, EventEmitter } from "@angular/core";


@Injectable()
export class MapChangeDetectorRef {
  public changesDetected = new EventEmitter<boolean>();

  public hasBeenDrawn = false;

  public detectChanges() {
    this.changesDetected.emit(true);
  }
}

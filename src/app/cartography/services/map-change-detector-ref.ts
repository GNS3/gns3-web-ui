import { EventEmitter, Injectable } from '@angular/core';

@Injectable()
export class MapChangeDetectorRef {
  public changesDetected = new EventEmitter<boolean>();
  public selectionChangesDetected = new EventEmitter<void>();

  public hasBeenDrawn = false;

  public detectChanges() {
    console.log('from map change detector');
    this.changesDetected.emit(true);
  }

  public detectSelectionChanges() {
    this.selectionChangesDetected.emit();
  }
}

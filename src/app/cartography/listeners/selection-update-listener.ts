import { Injectable } from "@angular/core";
import { Subscription } from "rxjs";
import { MapChangeDetectorRef } from "../services/map-change-detector-ref";
import { SelectionManager } from "../managers/selection-manager";


@Injectable()
export class SelectionUpdateListener {
  private onSelected: Subscription;
  private onUnselected: Subscription;

  constructor(
    private selectionManager: SelectionManager,
    private mapChangeDetectorRef: MapChangeDetectorRef
  ) {
  }

  public onInit(svg: any) {
    this.onSelected = this.selectionManager.selected.subscribe(() => {
      this.mapChangeDetectorRef.detectChanges();
    });
    this.onUnselected = this.selectionManager.unselected.subscribe(() => {
      this.mapChangeDetectorRef.detectChanges();
    });
  }

  public onDestroy() {
    this.onSelected.unsubscribe();
    this.onUnselected.unsubscribe();
  }
}
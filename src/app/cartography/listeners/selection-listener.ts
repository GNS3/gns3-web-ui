import { Injectable } from "@angular/core";
import { Subscription } from "rxjs";
import { SelectionStore } from "../managers/selection-manager";
import { MapChangeDetectorRef } from "../services/map-change-detector-ref";


@Injectable()
export class SelectionListener {
  private onSelected: Subscription;
  private onUnselected: Subscription;

  constructor(
    private selectionStore: SelectionStore,
    private mapChangeDetectorRef: MapChangeDetectorRef
  ) {
  }

  public onInit(svg: any) {
    this.onSelected = this.selectionStore.selected.subscribe(() => {
      this.mapChangeDetectorRef.detectChanges();
    });
    this.onUnselected = this.selectionStore.unselected.subscribe(() => {
      this.mapChangeDetectorRef.detectChanges();
    });
  }

  public onDestroy() {
    this.onSelected.unsubscribe();
    this.onUnselected.unsubscribe();
  }
}
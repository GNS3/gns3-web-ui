import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { SelectionManager } from '../../managers/selection-manager';
import { MapChangeDetectorRef } from '../../services/map-change-detector-ref';

@Component({
  selector: 'app-selection-select',
  templateUrl: './selection-select.component.html',
  styleUrls: ['./selection-select.component.scss']
})
export class SelectionSelectComponent implements OnInit, OnDestroy {
  private onSelected: Subscription;
  private onUnselected: Subscription;
  
  constructor(
    private selectionManager: SelectionManager,
    private mapChangeDetectorRef: MapChangeDetectorRef
  ) { }

  ngOnInit() {
    this.onSelected = this.selectionManager.selected.subscribe(() => {
      this.mapChangeDetectorRef.detectChanges();
    });
    this.onUnselected = this.selectionManager.unselected.subscribe(() => {
      this.mapChangeDetectorRef.detectChanges();
    });
  }

  ngOnDestroy() {
    this.onSelected.unsubscribe();
    this.onUnselected.unsubscribe();
  }

}

import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { SelectionManager } from '../../managers/selection-manager';
import { MapChangeDetectorRef } from '../../services/map-change-detector-ref';

@Component({
  standalone: true,
  selector: 'app-selection-select',
  templateUrl: './selection-select.component.html',
  styleUrls: ['./selection-select.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
})
export class SelectionSelectComponent implements OnInit, OnDestroy {
  private onSelected: Subscription;
  private onUnselected: Subscription;

  private selectionManager = inject(SelectionManager);
  private mapChangeDetectorRef = inject(MapChangeDetectorRef);

  ngOnInit() {
    this.onSelected = this.selectionManager.selected.subscribe(() => {
      this.mapChangeDetectorRef.detectSelectionChanges();
    });
    this.onUnselected = this.selectionManager.unselected.subscribe(() => {
      this.mapChangeDetectorRef.detectSelectionChanges();
    });
  }

  ngOnDestroy() {
    this.onSelected.unsubscribe();
    this.onUnselected.unsubscribe();
  }
}

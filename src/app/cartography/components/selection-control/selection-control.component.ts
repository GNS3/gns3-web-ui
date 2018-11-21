import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { SelectionEventSource } from '../../events/selection-event-source';
import { GraphDataManager } from '../../managers/graph-data-manager';
import { InRectangleHelper } from '../../helpers/in-rectangle-helper';
import { SelectionManager } from '../../managers/selection-manager';
import { Rectangle } from '../../models/rectangle';

@Component({
  selector: 'app-selection-control',
  templateUrl: './selection-control.component.html',
  styleUrls: ['./selection-control.component.scss']
})
export class SelectionControlComponent implements OnInit, OnDestroy {
  private onSelection: Subscription;
  
  constructor(
    private selectionEventSource: SelectionEventSource,
    private graphDataManager: GraphDataManager,
    private inRectangleHelper: InRectangleHelper,
    private selectionManager: SelectionManager
  ) { }

  ngOnInit() {
    this.onSelection = this.selectionEventSource.selected.subscribe((rectangle: Rectangle) => {
      const selectedNodes = this.graphDataManager.getNodes().filter((node) => {
        return this.inRectangleHelper.inRectangle(rectangle, node.x, node.y)
      });

      const selectedLinks = this.graphDataManager.getLinks().filter((link) => {
        return this.inRectangleHelper.inRectangle(rectangle, link.x, link.y)
      });
  
      const selectedDrawings = this.graphDataManager.getDrawings().filter((drawing) => {
        return this.inRectangleHelper.inRectangle(rectangle, drawing.x, drawing.y)
      });
  
      const selectedLabels = this.graphDataManager.getNodes().filter((node) => {
        if (node.label === undefined) {
          return false;
        }
        const labelX = node.x + node.label.x;
        const labelY = node.y + node.label.y;
        return this.inRectangleHelper.inRectangle(rectangle, labelX, labelY);
      }).map((node) => node.label);

      const selected = [
        ...selectedNodes,
        ...selectedLinks,
        ...selectedDrawings,
        ...selectedLabels
      ];
  
      this.selectionManager.setSelected(selected);
    });
  }

  ngOnDestroy() {
    this.onSelection.unsubscribe();
  }

}

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { NodesDataSource } from '../../../../../cartography/datasources/nodes-datasource';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { NodeService } from '@services/node.service';

@Component({
  selector: 'app-align-horizontally-action',
  templateUrl: './align-horizontally.component.html',
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlignHorizontallyActionComponent implements OnInit {
  private nodesDataSource = inject(NodesDataSource);
  private nodeService = inject(NodeService);
  private cdr = inject(ChangeDetectorRef);

  readonly controller = input<Controller>(undefined);
  readonly nodes = input<Node[]>(undefined);

  ngOnInit() {}

  alignHorizontally() {
    let averageY: number = 0;
    this.nodes().forEach((node) => {
      averageY += node.y;
    });
    averageY = averageY / this.nodes().length;

    this.nodes().forEach((node) => {
      node.y = averageY;
      this.nodesDataSource.update(node);

      this.nodeService.update(this.controller(), node).subscribe((node: Node) => {
        this.cdr.markForCheck();
      });
    });
  }
}

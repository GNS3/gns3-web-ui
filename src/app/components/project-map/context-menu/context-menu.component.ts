import { ChangeDetectorRef, Component, Input, OnInit, ViewChild } from '@angular/core';
import { MatMenuTrigger } from "@angular/material";
import { DomSanitizer } from "@angular/platform-browser";
import { Node } from "../../../cartography/models/node";
import { Server } from "../../../models/server";
import { Project } from "../../../models/project";
import { ProjectService } from "../../../services/project.service";
import { Drawing } from '../../../cartography/models/drawing';


@Component({
  selector: 'app-context-menu',
  templateUrl: './context-menu.component.html',
  styleUrls: ['./context-menu.component.scss']
})
export class ContextMenuComponent implements OnInit {
  @Input() project: Project;
  @Input() server: Server;

  @ViewChild(MatMenuTrigger) contextMenu: MatMenuTrigger;

  topPosition;
  leftPosition;
  node: Node;
  drawing: Drawing;
  private hasNodeCapabilities: boolean = false;
  private hasDrawingCapabilities: boolean = false;

  constructor(
    private sanitizer: DomSanitizer,
    private changeDetector: ChangeDetectorRef,
    protected projectService: ProjectService) {}

  ngOnInit() {
    this.setPosition(0, 0);
  }

  public setPosition(top: number, left: number) {
    this.topPosition = this.sanitizer.bypassSecurityTrustStyle(top + "px");
    this.leftPosition = this.sanitizer.bypassSecurityTrustStyle(left + "px");
    this.changeDetector.detectChanges();
  }

  public openMenuForNode(node: Node, top: number, left: number) {
    this.resetCapabilities();
    this.hasNodeCapabilities = true;

    this.node = node;
    this.setPosition(top, left);

    this.contextMenu.openMenu();
  }

  public openMenuForDrawing(drawing: Drawing, top: number, left: number) {
    this.resetCapabilities();
    this.hasDrawingCapabilities = true;

    this.drawing = drawing;
    this.setPosition(top, left);

    this.contextMenu.openMenu();
  }

  private resetCapabilities() {
    this.node = null;
    this.drawing = null;
    this.hasDrawingCapabilities = false;
    this.hasNodeCapabilities = false;
  }
}

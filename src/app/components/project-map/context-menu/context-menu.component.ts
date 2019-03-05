import { ChangeDetectorRef, Component, Input, OnInit, ViewChild } from '@angular/core';
import { MatMenuTrigger } from '@angular/material';
import { DomSanitizer } from '@angular/platform-browser';
import { Node } from '../../../cartography/models/node';
import { Server } from '../../../models/server';
import { Project } from '../../../models/project';
import { ProjectService } from '../../../services/project.service';
import { Drawing } from '../../../cartography/models/drawing';
import { TextElement } from '../../../cartography/models/drawings/text-element';
import { Label } from '../../../cartography/models/label';
import { Link } from '../../../models/link';
import { ElectronService } from 'ngx-electron';


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

  drawings: Drawing[] = [];
  nodes: Node[] = [];
  labels: Label[] = [];
  links: Link[] = [];

  hasTextCapabilities = false;
  isElectronApp = false;

  constructor(
    private sanitizer: DomSanitizer,
    private changeDetector: ChangeDetectorRef,
    private electronService: ElectronService,
    public projectService: ProjectService
  ) {}

  ngOnInit() {
    this.setPosition(0, 0);
    this.isElectronApp = this.electronService.isElectronApp;
  }

  public setPosition(top: number, left: number) {
    this.topPosition = this.sanitizer.bypassSecurityTrustStyle(top + 'px');
    this.leftPosition = this.sanitizer.bypassSecurityTrustStyle(left + 'px');
    this.changeDetector.detectChanges();
  }

  public openMenuForDrawing(drawing: Drawing, top: number, left: number) {
    this.resetCapabilities();
    this.hasTextCapabilities = drawing.element instanceof TextElement;

    this.drawings = [drawing];
    this.setPosition(top, left);

    this.contextMenu.openMenu();
  }

  public openMenuForNode(node: Node, top: number, left: number) {
    this.resetCapabilities();

    this.nodes = [node];
    this.setPosition(top, left);

    this.contextMenu.openMenu();
  }

  public openMenuForLabel(label: Label, top: number, left: number) {
    this.resetCapabilities();

    this.labels = [label];
    this.setPosition(top, left);

    this.contextMenu.openMenu();
  }

  public openMenuForListOfElements(drawings: Drawing[], nodes: Node[], labels: Label[], links: Link[], top: number, left: number) {
    this.resetCapabilities();

    this.drawings = drawings;
    this.nodes = nodes;
    this.labels = labels;
    this.links = links;
    this.setPosition(top, left);

    this.contextMenu.openMenu();
  }

  private resetCapabilities() {
    this.drawings = [];
    this.nodes = [];
    this.labels = [];
    this.hasTextCapabilities = false;
  }
}

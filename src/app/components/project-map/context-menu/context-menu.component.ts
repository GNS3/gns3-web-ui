import { ChangeDetectorRef, Component, Input, OnInit, ViewChild } from '@angular/core';
import { MatMenuTrigger } from '@angular/material';
import { DomSanitizer } from '@angular/platform-browser';
import { ElectronService } from 'ngx-electron';
import { Drawing } from '../../../cartography/models/drawing';
import { TextElement } from '../../../cartography/models/drawings/text-element';
import { Label } from '../../../cartography/models/label';
import { Node } from '../../../cartography/models/node';
import { Link } from '../../../models/link';
import { LinkNode } from '../../../models/link-node';
import { Project } from '../../../models/project';
import { Server } from '../../../models/server';
import { ProjectService } from '../../../services/project.service';


@Component({
  selector: 'app-context-menu',
  templateUrl: './context-menu.component.html',
  styleUrls: ['./context-menu.component.scss']
})
export class ContextMenuComponent implements OnInit {
  @Input() project: Project;
  @Input() server: Server;

  @ViewChild(MatMenuTrigger, {static: false}) contextMenu: MatMenuTrigger;

  topPosition;
  leftPosition;

  drawings: Drawing[] = [];
  nodes: Node[] = [];
  labels: Label[] = [];
  links: Link[] = [];
  linkNodes: LinkNode[] = [];

  hasTextCapabilities = false;
  isElectronApp = false;
  isBundledServer = false;

  constructor(
    private sanitizer: DomSanitizer,
    private changeDetector: ChangeDetectorRef,
    private electronService: ElectronService,
    public projectService: ProjectService
  ) {}

  ngOnInit() {
    this.setPosition(0, 0);

    this.isElectronApp = this.electronService.isElectronApp;
    this.isBundledServer = this.server.location === 'bundled';
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

  public openMenuForLabel(label: Label, node: Node, top: number, left: number) {
    this.resetCapabilities();

    this.labels = [label];
    this.nodes = [node];
    this.setPosition(top, left);

    this.contextMenu.openMenu();
  }

  public openMenuForInterfaceLabel(linkNode: LinkNode, link: Link, top: number, left: number) {
    this.resetCapabilities();

    this.linkNodes = [linkNode];
    this.links = [link];
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
    this.linkNodes = [];
    this.links = [];
    this.hasTextCapabilities = false;
  }
}

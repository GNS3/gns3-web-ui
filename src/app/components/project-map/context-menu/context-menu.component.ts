import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { DomSanitizer } from '@angular/platform-browser';
import { Drawing } from '../../../cartography/models/drawing';
import { TextElement } from '../../../cartography/models/drawings/text-element';
import { Label } from '../../../cartography/models/label';
import { Node } from '../../../cartography/models/node';
import { Link } from '@models/link';
import { LinkNode } from '@models/link-node';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { ProjectService } from '@services/project.service';
import { ShowNodeActionComponent } from './actions/show-node-action/show-node-action.component';
import { ConfigActionComponent } from './actions/config-action/config-action.component';
import { StartNodeActionComponent } from './actions/start-node-action/start-node-action.component';
import { SuspendNodeActionComponent } from './actions/suspend-node-action/suspend-node-action.component';
import { StopNodeActionComponent } from './actions/stop-node-action/stop-node-action.component';
import { ReloadNodeActionComponent } from './actions/reload-node-action/reload-node-action.component';
import { HttpConsoleActionComponent } from './actions/http-console/http-console-action.component';
import { HttpConsoleNewTabActionComponent } from './actions/http-console-new-tab/http-console-new-tab-action.component';
import { ConsoleDeviceActionBrowserComponent } from './actions/console-device-action-browser/console-device-action-browser.component';
import { IsolateNodeActionComponent } from './actions/isolate-node-action/isolate-node-action.component';
import { UnisolateNodeActionComponent } from './actions/unisolate-node-action/unisolate-node-action.component';
import { ChangeHostnameActionComponent } from './actions/change-hostname/change-hostname-action.component';
import { ChangeSymbolActionComponent } from './actions/change-symbol/change-symbol-action.component';
import { DuplicateActionComponent } from './actions/duplicate-action/duplicate-action.component';
import { EditStyleActionComponent } from './actions/edit-style-action/edit-style-action.component';
import { EditTextActionComponent } from './actions/edit-text-action/edit-text-action.component';
import { EditConfigActionComponent } from './actions/edit-config/edit-config-action.component';
import { ExportConfigActionComponent } from './actions/export-config/export-config-action.component';
import { ImportConfigActionComponent } from './actions/import-config/import-config-action.component';
import { IdlePcActionComponent } from './actions/idle-pc-action/idle-pc-action.component';
import { AutoIdlePcActionComponent } from './actions/auto-idle-pc-action/auto-idle-pc-action.component';
import { MoveLayerUpActionComponent } from './actions/move-layer-up-action/move-layer-up-action.component';
import { MoveLayerDownActionComponent } from './actions/move-layer-down-action/move-layer-down-action.component';
import { BringToFrontActionComponent } from './actions/bring-to-front-action/bring-to-front-action.component';
import { StartCaptureActionComponent } from './actions/start-capture/start-capture-action.component';
import { StopCaptureActionComponent } from './actions/stop-capture/stop-capture-action.component';
import { StartCaptureOnStartedLinkActionComponent } from './actions/start-capture-on-started-link/start-capture-on-started-link.component';
import { StartWebWiresharkActionComponent } from './actions/start-web-wireshark-action/start-web-wireshark-action.component';
import { StartWebWiresharkInlineActionComponent } from './actions/start-web-wireshark-inline-action/start-web-wireshark-inline-action.component';
import { PacketFiltersActionComponent } from './actions/packet-filters-action/packet-filters-action.component';
import { ResumeLinkActionComponent } from './actions/resume-link-action/resume-link-action.component';
import { SuspendLinkActionComponent } from './actions/suspend-link/suspend-link-action.component';
import { ResetLinkActionComponent } from './actions/reset-link/reset-link-action.component';
import { EditLinkStyleActionComponent } from './actions/edit-link-style-action/edit-link-style-action.component';
import { LockActionComponent } from './actions/lock-action/lock-action.component';
import { DeleteActionComponent } from './actions/delete-action/delete-action.component';
import { AlignHorizontallyActionComponent } from './actions/align-horizontally/align-horizontally.component';
import { AlignVerticallyActionComponent } from './actions/align_vertically/align-vertically.component';

@Component({
  selector: 'app-context-menu',
  templateUrl: './context-menu.component.html',
  styleUrl: './context-menu.component.scss',
  imports: [
    CommonModule,
    MatMenuModule,
    ShowNodeActionComponent,
    ConfigActionComponent,
    StartNodeActionComponent,
    SuspendNodeActionComponent,
    StopNodeActionComponent,
    ReloadNodeActionComponent,
    HttpConsoleActionComponent,
    HttpConsoleNewTabActionComponent,
    ConsoleDeviceActionBrowserComponent,
    IsolateNodeActionComponent,
    UnisolateNodeActionComponent,
    ChangeHostnameActionComponent,
    ChangeSymbolActionComponent,
    DuplicateActionComponent,
    EditStyleActionComponent,
    EditTextActionComponent,
    EditConfigActionComponent,
    ExportConfigActionComponent,
    ImportConfigActionComponent,
    IdlePcActionComponent,
    AutoIdlePcActionComponent,
    MoveLayerUpActionComponent,
    MoveLayerDownActionComponent,
    BringToFrontActionComponent,
    StartCaptureActionComponent,
    StopCaptureActionComponent,
    StartCaptureOnStartedLinkActionComponent,
    StartWebWiresharkActionComponent,
    StartWebWiresharkInlineActionComponent,
    PacketFiltersActionComponent,
    ResumeLinkActionComponent,
    SuspendLinkActionComponent,
    ResetLinkActionComponent,
    EditLinkStyleActionComponent,
    LockActionComponent,
    DeleteActionComponent,
    AlignHorizontallyActionComponent,
    AlignVerticallyActionComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContextMenuComponent implements OnInit {
  private sanitizer = inject(DomSanitizer);
  private changeDetector = inject(ChangeDetectorRef);
  public projectService = inject(ProjectService);

  @Input() project: Project;
  @Input() controller: Controller;
  @Output() openWebWiresharkInline = new EventEmitter<{ link: Link; controller: Controller; project: Project }>();
  @Output() openWebConsoleInline = new EventEmitter<{ node: Node; controller: Controller; project: Project }>();

  @ViewChild(MatMenuTrigger) contextMenu: MatMenuTrigger;

  topPosition;
  leftPosition;

  drawings: Drawing[] = [];
  nodes: Node[] = [];
  labels: Label[] = [];
  links: Link[] = [];
  linkNodes: LinkNode[] = [];

  hasTextCapabilities = false;
  isBundledController: boolean = false;

  constructor() {}

  ngOnInit() {
    this.setPosition(0, 0);

    this.isBundledController = this.controller.location === 'bundled';
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

  public openMenuForListOfElements(
    drawings: Drawing[],
    nodes: Node[],
    labels: Label[],
    links: Link[],
    top: number,
    left: number
  ) {
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

  public onOpenWebWiresharkInline(data: { link: Link; controller: Controller; project: Project }) {
    this.openWebWiresharkInline.emit(data);
  }

  public onOpenWebConsoleInline(data: { node: Node; controller: Controller; project: Project }) {
    this.openWebConsoleInline.emit(data);
  }
}

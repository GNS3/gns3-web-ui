import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatDialog } from '@angular/material';
import { TemplateListDialogComponent, NodeAddedEvent } from './template-list-dialog/template-list-dialog.component';

import { Server } from '../../models/server';
import { Template } from '../../models/template';
import { Project } from '../../models/project';
import { TemplateService } from '../../services/template.service';
import { MapScaleService } from '../../services/mapScale.service';
import { SymbolService } from '../../services/symbol.service';

@Component({
  selector: 'app-template',
  templateUrl: './template.component.html',
  styleUrls: ['./template.component.scss']
})
export class TemplateComponent implements OnInit {
  @Input() server: Server;
  @Input() project: Project;
  @Output() onNodeCreation = new EventEmitter<any>();

  templates: Template[] = [];
  filteredTemplates: Template[] = [];
  searchText: string = '';
  templateTypes: string[] = ['all', 'cloud', 'ethernet_hub', 'ethernet_switch', 'docker', 'dynamips', 'vpcs', 'traceng', 'virtualbox', 'vmware', 'iou', 'qemu'];
  selectedType: string;

  movementX: number;
  movementY: number;

  startX: number;
  startY: number;

  constructor(
    private dialog: MatDialog,
    private templateService: TemplateService,
    private scaleService: MapScaleService,
    private symbolService: SymbolService
  ) {}

  ngOnInit() {
    this.templateService.list(this.server).subscribe((listOfTemplates: Template[]) => {
      this.filteredTemplates = listOfTemplates;
      this.templates = listOfTemplates;
    });
    this.symbolService.list(this.server);
  }

  filterTemplates(event) {
    let temporaryTemplates = this.templates.filter(item => {
      return item.name.toLowerCase().includes(this.searchText.toLowerCase());
    });

    if (this.selectedType === 'all') {
      this.filteredTemplates = temporaryTemplates;
    } else  {
      this.filteredTemplates = temporaryTemplates.filter(t => t.template_type === this.selectedType);
    }
  }

  dragStart(ev) {
    let elemRect = (event.target as HTMLElement).getBoundingClientRect();

    this.startX = (event as MouseEvent).clientX;
    this.startY = (event as MouseEvent).clientY;

    this.movementY = elemRect.top - (event as MouseEvent).clientY;
    this.movementX = elemRect.left - (event as MouseEvent).clientX;
  }

  dragEnd(ev, template: Template) {
    this.symbolService.raw(this.server, template.symbol.substring(1)).subscribe((symbolSvg: string) => {
      let width = +symbolSvg.split("width=\"")[1].split("\"")[0] ? +symbolSvg.split("width=\"")[1].split("\"")[0] : 0;
      let scale = this.scaleService.getScale();

      let nodeAddedEvent: NodeAddedEvent = {
        template: template,
        server: 'local',
        numberOfNodes: 1,
        x: (this.startX + ev.x - this.project.scene_width/2 - (width/2)) * scale + window.scrollX ,
        y: (this.startY + ev.y - this.project.scene_height/2) * scale + window.scrollY
      };
      this.onNodeCreation.emit(nodeAddedEvent);
    });
  }

  openDialog() {
    const dialogRef = this.dialog.open(TemplateListDialogComponent, {
      width: '600px',
      data: {
        server: this.server,
        project: this.project
      },
      autoFocus: false,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((nodeAddedEvent: NodeAddedEvent) => {
      if (nodeAddedEvent !== null) {
        this.onNodeCreation.emit(nodeAddedEvent);
      }
    });
  }

  getImageSourceForTemplate(template: Template) {
    return `http://${this.server.host}:${this.server.port}/v2${template.symbol.substring(1)}/raw`;
  }
}

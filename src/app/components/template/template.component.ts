import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatDialog } from '@angular/material';
import { TemplateListDialogComponent, NodeAddedEvent } from './template-list-dialog/template-list-dialog.component';

import { Server } from '../../models/server';
import { Template } from '../../models/template';
import { Project } from '../../models/project';
import { TemplateService } from '../../services/template.service';
import { MapScaleService } from '../../services/mapScale.service';

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

  constructor(
    private dialog: MatDialog,
    private templateService: TemplateService,
    private scaleService: MapScaleService
  ) {}

  ngOnInit() {
    this.templateService.list(this.server).subscribe((listOfTemplates: Template[]) => {
      this.filteredTemplates = listOfTemplates;
      this.templates = listOfTemplates;
    });
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

  dragEnd(ev, template) {
    console.log('Element was dragged', ev);
    console.log('Template', template);
    console.log((event as MouseEvent).clientX, (event as MouseEvent).clientY);

    let scale = this.scaleService.getScale();
    let nodeAddedEvent: NodeAddedEvent = {
      template: template,
      server: 'local',
      numberOfNodes: 1,
      x: ((event as MouseEvent).clientX - this.project.scene_width/2 + window.scrollX) * scale, //template.width
      y: ((event as MouseEvent).clientY - this.project.scene_height/2 + window.scrollY) * scale
    };
    this.onNodeCreation.emit(nodeAddedEvent);
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

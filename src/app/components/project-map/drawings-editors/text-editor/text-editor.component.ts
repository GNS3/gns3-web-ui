import { Component, OnInit, ViewChild, ElementRef, Renderer2 } from '@angular/core';
import { Project } from '../../../../models/project';
import { Drawing } from '../../../../cartography/models/drawing';
import { Server } from '../../../../models/server';
import { MatDialogRef } from '@angular/material';
import { DrawingToMapDrawingConverter } from '../../../../cartography/converters/map/drawing-to-map-drawing-converter';
import { MapDrawingToSvgConverter } from '../../../../cartography/converters/map/map-drawing-to-svg-converter';
import { DrawingService } from '../../../../services/drawing.service';
import { DrawingsDataSource } from '../../../../cartography/datasources/drawings-datasource';
import { TextElement } from '../../../../cartography/models/drawings/text-element';
import { Label } from '../../../../cartography/models/label';
import { NodeService } from '../../../../services/node.service';
import { Node } from '../../../../cartography/models/node';
import { NodesDataSource } from '../../../../cartography/datasources/nodes-datasource';
import { Link } from '../../../../models/link';
import { LinkNode } from '../../../../models/link-node';
import { LinkService } from '../../../../services/link.service';
import { LinksDataSource } from '../../../../cartography/datasources/links-datasource';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { ToasterService } from '../../../../services/toaster.service';
import { RotationValidator } from '../../../../validators/rotation-validator';

@Component({
  selector: 'app-text-editor',
  templateUrl: './text-editor.component.html',
  styleUrls: ['./text-editor.component.scss']
})
export class TextEditorDialogComponent implements OnInit {
  @ViewChild('textArea', {static: true}) textArea: ElementRef;

  server: Server;
  project: Project;
  drawing: Drawing;
  node: Node;
  label: Label;
  link: Link;
  linkNode: LinkNode;
  element: TextElement;
  rotation: string;
  isTextEditable: boolean;
  formGroup: FormGroup;

  constructor(
    private dialogRef: MatDialogRef<TextEditorDialogComponent>,
    private drawingToMapDrawingConverter: DrawingToMapDrawingConverter,
    private mapDrawingToSvgConverter: MapDrawingToSvgConverter,
    private drawingService: DrawingService,
    private drawingsDataSource: DrawingsDataSource,
    private renderer: Renderer2,
    private nodeService: NodeService,
    private nodesDataSource: NodesDataSource,
    private linkService: LinkService,
    private linksDataSource: LinksDataSource,
    private formBuilder: FormBuilder,
    private toasterService: ToasterService,
    private rotationValidator: RotationValidator
  ) {}

  ngOnInit() {
    this.formGroup = this.formBuilder.group({
      rotation: new FormControl('', [Validators.required, this.rotationValidator.get])
    });

    if (this.label && this.node) {
      this.isTextEditable = false;
      this.rotation = this.label.rotation.toString();
      this.element = this.getTextElementFromLabel();
    } else if (this.linkNode && this.link) {
      this.isTextEditable = true;
      this.label = this.link.nodes.find(n => n.node_id === this.linkNode.node_id).label;
      this.rotation = this.label.rotation.toString();
      this.element = this.getTextElementFromLabel();
    } else if (this.drawing) {
      this.isTextEditable = true;
      this.rotation = this.drawing.rotation.toString();
      this.element = this.drawing.element as TextElement;
    };

    this.formGroup.controls['rotation'].setValue(this.rotation);
    this.renderer.setStyle(this.textArea.nativeElement, 'color', this.element.fill);
    this.renderer.setStyle(this.textArea.nativeElement, 'font-family', this.element.font_family);
    this.renderer.setStyle(this.textArea.nativeElement, 'font-size', `${this.element.font_size}pt`);
    this.renderer.setStyle(this.textArea.nativeElement, 'font-weight', this.element.font_weight);
  }

  getTextElementFromLabel(): TextElement{
    var styleProperties: StyleProperty[] = [];
    var textElement = new TextElement();

    for (var property of this.label.style.split(";")){
      styleProperties.push({
        property: property.split(": ")[0],
        value: property.split(": ")[1]
      });
    }

    textElement.text = this.label.text ? this.label.text : '';
    textElement.font_family = styleProperties.find(p => p.property === 'font-family') ? styleProperties.find(p => p.property === 'font-family').value : 'TypeWriter';
    textElement.font_size = styleProperties.find(p => p.property === 'font-size') ? +styleProperties.find(p => p.property === 'font-size').value : 10.0;
    textElement.font_weight = styleProperties.find(p => p.property === 'font-weight') ? styleProperties.find(p => p.property === 'font-weight').value : 'normal';
    textElement.fill = styleProperties.find(p => p.property === 'fill') ? styleProperties.find(p => p.property === 'fill').value : '#000000';
    textElement.fill_opacity = styleProperties.find(p => p.property === 'fill-opacity') ? +styleProperties.find(p => p.property === 'fill-opacity').value : 1.0;

    return textElement;
  }

  getStyleFromTextElement(): string{
    return `font-family: ${this.element.font_family};font-size: ${this.element.font_size};font-weight: ${this.element.font_weight};fill: ${this.element.fill};fill-opacity: ${this.element.fill_opacity};`;
  }

  onNoClick() {
    this.dialogRef.close();
  }

  onYesClick() {
    if (this.formGroup.valid) {
      this.rotation = this.formGroup.get('rotation').value;

      if (this.label && this.node) {
        this.node.label.style = this.getStyleFromTextElement();
        this.node.label.rotation = +this.rotation;
  
        this.nodeService.updateLabel(this.server, this.node, this.node.label).subscribe((node: Node) => {
          this.nodesDataSource.update(node);
          this.dialogRef.close();
        });
      } else if (this.linkNode && this.link) {
        this.label.style = this.getStyleFromTextElement();
        this.label.rotation = +this.rotation;
        this.label.text = this.element.text;
  
        this.linkService.updateLink(this.server, this.link).subscribe((link: Link) => {
          this.linksDataSource.update(link);
          this.dialogRef.close();
        });
      } else if (this.drawing) {
        this.drawing.rotation = +this.rotation;
        this.drawing.element = this.element;
  
        let mapDrawing = this.drawingToMapDrawingConverter.convert(this.drawing);
        mapDrawing.element = this.drawing.element;
  
        this.drawing.svg = this.mapDrawingToSvgConverter.convert(mapDrawing);
  
        this.drawingService.update(this.server, this.drawing).subscribe((serverDrawing: Drawing) => {
          this.drawingsDataSource.update(serverDrawing);
          this.dialogRef.close();
        });
      };
    } else {
      this.toasterService.error(`Entered data is incorrect`);
    }
  }

  changeTextColor(changedColor) {
    this.renderer.setStyle(this.textArea.nativeElement, 'color', changedColor);
  }
}

export interface StyleProperty {
  property: string;
  value: string;
}

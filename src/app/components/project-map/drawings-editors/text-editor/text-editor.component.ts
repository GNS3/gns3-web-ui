import { Component, ElementRef, OnInit, Renderer2, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { DrawingToMapDrawingConverter } from '../../../../cartography/converters/map/drawing-to-map-drawing-converter';
import { MapDrawingToSvgConverter } from '../../../../cartography/converters/map/map-drawing-to-svg-converter';
import { DrawingsDataSource } from '../../../../cartography/datasources/drawings-datasource';
import { LinksDataSource } from '../../../../cartography/datasources/links-datasource';
import { NodesDataSource } from '../../../../cartography/datasources/nodes-datasource';
import { FontFixer } from '../../../../cartography/helpers/font-fixer';
import { Drawing } from '../../../../cartography/models/drawing';
import { TextElement } from '../../../../cartography/models/drawings/text-element';
import { Font } from '../../../../cartography/models/font';
import { Label } from '../../../../cartography/models/label';
import { Node } from '../../../../cartography/models/node';
import { Link } from '@models/link';
import { LinkNode } from '@models/link-node';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { DrawingService } from '@services/drawing.service';
import { LinkService } from '@services/link.service';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';
import { RotationValidator } from '../../../../validators/rotation-validator';

@Component({
  standalone: true,
  selector: 'app-text-editor',
  templateUrl: './text-editor.component.html',
  styleUrls: ['./text-editor.component.scss'],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule]
})
export class TextEditorDialogComponent implements OnInit {
  @ViewChild('textArea', { static: true }) textArea: ElementRef;

  private dialogRef = inject(MatDialogRef<TextEditorDialogComponent>);
  private drawingToMapDrawingConverter = inject(DrawingToMapDrawingConverter);
  private mapDrawingToSvgConverter = inject(MapDrawingToSvgConverter);
  private drawingService = inject(DrawingService);
  private drawingsDataSource = inject(DrawingsDataSource);
  private renderer = inject(Renderer2);
  private nodeService = inject(NodeService);
  private nodesDataSource = inject(NodesDataSource);
  private linkService = inject(LinkService);
  private linksDataSource = inject(LinksDataSource);
  private formBuilder = inject(UntypedFormBuilder);
  private toasterService = inject(ToasterService);
  private rotationValidator = inject(RotationValidator);
  private fontFixer = inject(FontFixer);

  controller: Controller;
  project: Project;
  drawing: Drawing;
  node: Node;
  label: Label;
  link: Link;
  linkNode: LinkNode;
  element: TextElement;
  rotation: string;
  isTextEditable: boolean;
  formGroup: UntypedFormGroup;

  constructor() {}

  ngOnInit() {
    this.formGroup = this.formBuilder.group({
      rotation: new UntypedFormControl('', [Validators.required, this.rotationValidator.get]),
    });

    if (this.label && this.node) {
      this.isTextEditable = false;
      this.rotation = this.label.rotation.toString();
      this.element = this.getTextElementFromLabel();
    } else if (this.linkNode && this.link) {
      this.isTextEditable = true;
      this.label = this.link.nodes.find((n) => n.node_id === this.linkNode.node_id).label;
      this.rotation = this.label.rotation.toString();
      this.element = this.getTextElementFromLabel();
    } else if (this.drawing) {
      this.isTextEditable = true;
      this.rotation = this.drawing.rotation.toString();
      this.element = this.drawing.element as TextElement;
    }

    let font: Font = {
      font_family: this.element.font_family,
      font_size: this.element.font_size,
      font_weight: this.element.font_weight,
    };
    font = this.fontFixer.fix(font);

    this.formGroup.controls['rotation'].setValue(this.rotation);
    this.renderer.setStyle(this.textArea.nativeElement, 'color', this.element.fill);
    this.renderer.setStyle(this.textArea.nativeElement, 'font-family', font.font_family);
    this.renderer.setStyle(this.textArea.nativeElement, 'font-size', `${font.font_size}pt`);
    this.renderer.setStyle(this.textArea.nativeElement, 'font-weight', font.font_weight);
  }

  getTextElementFromLabel(): TextElement {
    var styleProperties: StyleProperty[] = [];
    var textElement = new TextElement();

    for (var property of this.label.style.split(';')) {
      styleProperties.push({
        property: property.split(': ')[0],
        value: property.split(': ')[1],
      });
    }

    textElement.text = this.label.text ? this.label.text : '';
    textElement.font_family = styleProperties.find((p) => p.property === 'font-family')
      ? styleProperties.find((p) => p.property === 'font-family').value
      : 'TypeWriter';
    textElement.font_size = styleProperties.find((p) => p.property === 'font-size')
      ? +styleProperties.find((p) => p.property === 'font-size').value
      : 10.0;
    textElement.font_weight = styleProperties.find((p) => p.property === 'font-weight')
      ? styleProperties.find((p) => p.property === 'font-weight').value
      : 'normal';
    textElement.fill = styleProperties.find((p) => p.property === 'fill')
      ? styleProperties.find((p) => p.property === 'fill').value
      : '#000000';
    textElement.fill_opacity = styleProperties.find((p) => p.property === 'fill-opacity')
      ? +styleProperties.find((p) => p.property === 'fill-opacity').value
      : 1.0;

    return textElement;
  }

  getStyleFromTextElement(): string {
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

        this.nodeService.updateLabel(this.controller, this.node, this.node.label).subscribe((node: Node) => {
          this.nodesDataSource.update(node);
          this.dialogRef.close();
        });
      } else if (this.linkNode && this.link) {
        this.label.style = this.getStyleFromTextElement();
        this.label.rotation = +this.rotation;
        this.label.text = this.element.text;

        this.linkService.updateLink(this.controller, this.link).subscribe((link: Link) => {
          this.linksDataSource.update(link);
          this.dialogRef.close();
        });
      } else if (this.drawing) {
        this.drawing.rotation = +this.rotation;
        this.drawing.element = this.element;

        let mapDrawing = this.drawingToMapDrawingConverter.convert(this.drawing);
        mapDrawing.element = this.drawing.element;

        this.drawing.svg = this.mapDrawingToSvgConverter.convert(mapDrawing);

        this.drawingService.update(this.controller, this.drawing).subscribe((controllerDrawing: Drawing) => {
          this.drawingsDataSource.update(controllerDrawing);
          this.dialogRef.close();
        });
      }
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

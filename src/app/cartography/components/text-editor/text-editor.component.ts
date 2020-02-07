import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Renderer2, ViewChild } from '@angular/core';
import { select } from 'd3-selection';
import { Subscription } from 'rxjs';
import { StyleProperty } from '../../../components/project-map/drawings-editors/text-editor/text-editor.component';
import { Link } from '../../../models/link';
import { Server } from '../../../models/server';
import { LinkService } from '../../../services/link.service';
import { MapScaleService } from '../../../services/mapScale.service';
import { ToolsService } from '../../../services/tools.service';
import { LinksDataSource } from '../../datasources/links-datasource';
import { NodesDataSource } from '../../datasources/nodes-datasource';
import { DrawingsEventSource } from '../../events/drawings-event-source';
import { TextAddedDataEvent, TextEditedDataEvent } from '../../events/event-source';
import { FontFixer } from '../../helpers/font-fixer';
import { SelectionManager } from '../../managers/selection-manager';
import { Context } from '../../models/context';
import { TextElement } from '../../models/drawings/text-element';
import { Font } from '../../models/font';
import { MapLabel } from '../../models/map/map-label';
import { MapLinkNode } from '../../models/map/map-link-node';
import { MapNode } from '../../models/map/map-node';
import { Node } from '../../models/node';

@Component({
  selector: 'app-text-editor',
  templateUrl: './text-editor.component.html',
  styleUrls: ['./text-editor.component.scss']
})
export class TextEditorComponent implements OnInit, OnDestroy {
  @ViewChild('temporaryTextElement', {static: false}) temporaryTextElement: ElementRef;
  @Input('svg') svg: SVGSVGElement;
  @Input('server') server: Server;

  leftPosition = '0px';
  topPosition = '0px';
  innerText = '';

  private editingDrawingId: string;
  private editedElement: any;
  private editedLink: MapLinkNode;
  private editedNode: Node;

  private mapListener: Function;
  private textListener: Function;
  private textAddingSubscription: Subscription;
  public addingFinished = new EventEmitter<any>();

  constructor(
    private drawingsEventSource: DrawingsEventSource,
    private toolsService: ToolsService,
    private context: Context,
    private renderer: Renderer2,
    private mapScaleService: MapScaleService,
    private linkService: LinkService,
    private linksDataSource: LinksDataSource,
    private nodesDataSource: NodesDataSource,
    private selectionManager: SelectionManager,
    private fontFixer: FontFixer
  ) {}

  ngOnInit() {
    this.textAddingSubscription = this.toolsService.isTextAddingToolActivated.subscribe((isActive: boolean) => {
      isActive ? this.activateTextAdding() : this.deactivateTextAdding();
    });

    this.activateTextEditingForDrawings();
    this.activateTextEditingForNodeLabels();
  }

  activateTextAdding() {
    const addTextListener = (event: MouseEvent) => {
      this.leftPosition = event.pageX.toString() + 'px';
      this.topPosition = event.pageY.toString() + 'px';
      this.renderer.setStyle(this.temporaryTextElement.nativeElement, 'display', 'initial');
      this.renderer.setStyle(this.temporaryTextElement.nativeElement, 'transform', `scale(${this.mapScaleService.getScale()})`);
      this.temporaryTextElement.nativeElement.focus();

      const textListener = () => {
        this.drawingsEventSource.textAdded.emit(
          new TextAddedDataEvent(
            this.temporaryTextElement.nativeElement.innerText.replace(/\n$/, ''),
            event.pageX,
            event.pageY
          )
        );
        this.deactivateTextAdding();
        this.innerText = '';
        this.temporaryTextElement.nativeElement.innerText = '';
        this.temporaryTextElement.nativeElement.removeEventListener('focusout', this.textListener);
        this.renderer.setStyle(this.temporaryTextElement.nativeElement, 'display', 'none');
      };
      this.textListener = textListener;
      this.temporaryTextElement.nativeElement.addEventListener('focusout', this.textListener);
    };

    this.deactivateTextAdding();
    this.mapListener = addTextListener;
    this.svg.addEventListener('click', this.mapListener as EventListenerOrEventListenerObject);
  }

  deactivateTextAdding() {
    this.svg.removeEventListener('click', this.mapListener as EventListenerOrEventListenerObject);
  }

  activateTextEditingForNodeLabels() {
    const rootElement = select(this.svg);

    rootElement
      .selectAll<SVGGElement, MapLinkNode>('g.interface_label_container')
      .select<SVGTextElement>('text.interface_label')
      .on('dblclick', (elem, index, textElements) => {
        this.selectionManager.setSelected([]);

        this.renderer.setStyle(this.temporaryTextElement.nativeElement, 'display', 'initial');
        this.renderer.setStyle(this.temporaryTextElement.nativeElement, 'transform', `scale(${this.mapScaleService.getScale()})`);
        this.editedLink = elem;

        select(textElements[index]).attr('visibility', 'hidden');
        select(textElements[index]).classed('editingMode', true);

        this.editedNode = this.nodesDataSource.get(elem.nodeId);
        this.editedLink = elem;
        const x = ((elem.label.originalX + this.editedNode.x - 1) * this.context.transformation.k) + this.context.getZeroZeroTransformationPoint().x + this.context.transformation.x;
        const y = ((elem.label.originalY + this.editedNode.y + 4) * this.context.transformation.k) + this.context.getZeroZeroTransformationPoint().y + this.context.transformation.y;
        this.leftPosition = x.toString() + 'px';
        this.topPosition = y.toString() + 'px';
        this.temporaryTextElement.nativeElement.innerText = elem.label.text;

        const styleProperties: StyleProperty[] = [];
        for (const property of elem.label.style.split(";")) {
          styleProperties.push({
            property: property.split(": ")[0],
            value: property.split(": ")[1]
          });
        }
        let font: Font = {
          font_family: styleProperties.find(p => p.property === 'font-family') ? styleProperties.find(p => p.property === 'font-family').value : 'TypeWriter',
          font_size: styleProperties.find(p => p.property === 'font-size') ? Number(styleProperties.find(p => p.property === 'font-size').value) : 10.0,
          font_weight: styleProperties.find(p => p.property === 'font-weight') ? styleProperties.find(p => p.property === 'font-weight').value : 'normal'
        };
        font = this.fontFixer.fix(font);
        this.renderer.setStyle(this.temporaryTextElement.nativeElement, 'color', styleProperties.find(p => p.property === 'fill') ? styleProperties.find(p => p.property === 'fill').value : '#000000');
        this.renderer.setStyle(this.temporaryTextElement.nativeElement, 'font-family', font.font_family);
        this.renderer.setStyle(this.temporaryTextElement.nativeElement, 'font-size', `${font.font_size}pt`);
        this.renderer.setStyle(this.temporaryTextElement.nativeElement, 'font-weight', font.font_weight);
        
        const listener = () => {
          const innerText = this.temporaryTextElement.nativeElement.innerText;
          const link: Link = this.linksDataSource.get(this.editedLink.linkId);
          link.nodes.find(n => n.node_id === this.editedNode.node_id).label.text = innerText;

          this.linkService.updateLink(this.server, link).subscribe((link: Link) => {
            rootElement
              .selectAll<SVGTextElement, TextElement>('text.editingMode')
              .attr('visibility', 'visible')
              .classed('editingMode', false);

            this.innerText = '';
            this.temporaryTextElement.nativeElement.innerText = '';
            this.temporaryTextElement.nativeElement.removeEventListener('focusout', this.textListener);

            this.clearStyle();
            this.renderer.setStyle(this.temporaryTextElement.nativeElement, 'display', 'none');
          });
        };
        this.textListener = listener;
        this.temporaryTextElement.nativeElement.addEventListener('focusout', this.textListener);
        this.temporaryTextElement.nativeElement.focus();
      });
  }

  activateTextEditingForDrawings() {
    const rootElement = select(this.svg);

    rootElement
      .selectAll<SVGTextElement, TextElement>('text.text_element')
      .on('dblclick', (elem, index, textElements) => {
        this.renderer.setStyle(this.temporaryTextElement.nativeElement, 'display', 'initial');
        this.renderer.setStyle(this.temporaryTextElement.nativeElement, 'transform', `scale(${this.mapScaleService.getScale()})`);
        this.editedElement = elem;

        select(textElements[index]).attr('visibility', 'hidden');
        select(textElements[index]).classed('editingMode', true);

        this.editingDrawingId = textElements[index].parentElement.parentElement.getAttribute('drawing_id');
        const transformData = textElements[index].parentElement.getAttribute('transform').split(/\(|\)/);
        const x = (Number(transformData[1].split(/,/)[0]) * this.context.transformation.k) + this.context.getZeroZeroTransformationPoint().x + this.context.transformation.x;
        const y = (Number(transformData[1].split(/,/)[1]) * this.context.transformation.k) + this.context.getZeroZeroTransformationPoint().y + this.context.transformation.y;
        this.leftPosition = x.toString() + 'px';
        this.topPosition = y.toString() + 'px';
        this.temporaryTextElement.nativeElement.innerText = elem.text;

        this.renderer.setStyle(this.temporaryTextElement.nativeElement, 'color', elem.fill);
        this.renderer.setStyle(this.temporaryTextElement.nativeElement, 'font-family', elem.font_family);
        this.renderer.setStyle(this.temporaryTextElement.nativeElement, 'font-size', `${elem.font_size}pt`);
        this.renderer.setStyle(this.temporaryTextElement.nativeElement, 'font-weight', elem.font_weight);

        const listener = () => {
          const innerText = this.temporaryTextElement.nativeElement.innerText;
          this.drawingsEventSource.textEdited.emit(
            new TextEditedDataEvent(this.editingDrawingId, innerText.replace(/\n$/, ''), this.editedElement)
          );

          rootElement
            .selectAll<SVGTextElement, TextElement>('text.editingMode')
            .attr('visibility', 'visible')
            .classed('editingMode', false);

          this.innerText = '';
          this.temporaryTextElement.nativeElement.innerText = '';
          this.temporaryTextElement.nativeElement.removeEventListener('focusout', this.textListener);

          this.clearStyle();
          this.renderer.setStyle(this.temporaryTextElement.nativeElement, 'display', 'none');
        };
        this.textListener = listener;
        this.temporaryTextElement.nativeElement.addEventListener('focusout', this.textListener);
        this.temporaryTextElement.nativeElement.focus();
      });
  }

  ngOnDestroy() {
    this.textAddingSubscription.unsubscribe();
  }

  clearStyle() {
    this.renderer.setStyle(this.temporaryTextElement.nativeElement, 'color', '#000000');
    this.renderer.setStyle(this.temporaryTextElement.nativeElement, 'font-family', 'Noto Sans');
    this.renderer.setStyle(this.temporaryTextElement.nativeElement, 'font-size', '11pt');
    this.renderer.setStyle(this.temporaryTextElement.nativeElement, 'font-weight', 'bold');
  }
}

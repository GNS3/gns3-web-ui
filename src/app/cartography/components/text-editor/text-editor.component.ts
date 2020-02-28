import { Component, ViewChild, ElementRef, OnInit, Input, EventEmitter, OnDestroy, Renderer2, NgZone } from '@angular/core';
import { DrawingsEventSource } from '../../events/drawings-event-source';
import { TextAddedDataEvent, TextEditedDataEvent } from '../../events/event-source';
import { ToolsService } from '../../../services/tools.service';
import { select } from 'd3-selection';
import { TextElement } from '../../models/drawings/text-element';
import { Context } from '../../models/context';
import { Subscription } from 'rxjs';
import { MapScaleService } from '../../../services/mapScale.service';
import { MapLabel } from '../../models/map/map-label';
import { MapNode } from '../../models/map/map-node';
import { NodesDataSource } from '../../datasources/nodes-datasource';
import { Node } from '../../models/node';
import { SelectionManager } from '../../managers/selection-manager';
import { Server } from '../../../models/server';
import { MapLinkNode } from '../../models/map/map-link-node';
import { LinkService } from '../../../services/link.service';
import { LinksDataSource } from '../../datasources/links-datasource';
import { Link } from '../../../models/link';
import { StyleProperty } from '../../../components/project-map/drawings-editors/text-editor/text-editor.component';
import { FontFixer } from '../../helpers/font-fixer';
import { Font } from '../../models/font';

@Component({
  selector: 'app-text-editor',
  templateUrl: './text-editor.component.html',
  styleUrls: ['./text-editor.component.scss']
})
export class TextEditorComponent implements OnInit, OnDestroy {
  @ViewChild('temporaryTextElement', {static: false}) temporaryTextElement: ElementRef;
  @Input('svg') svg: SVGSVGElement;
  @Input('server') server: Server;

  leftPosition: string = '0px';
  topPosition: string = '0px';
  innerText: string = '';

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
    private fontFixer: FontFixer,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    this.textAddingSubscription = this.toolsService.isTextAddingToolActivated.subscribe((isActive: boolean) => {
      isActive ? this.activateTextAdding() : this.deactivateTextAdding();
    });

    this.ngZone.runOutsideAngular(this.activateTextEditingForDrawings.bind(this));
    this.ngZone.runOutsideAngular(this.activateTextEditingForNodeLabels.bind(this));
  }

  activateTextAdding() {
    let addTextListener = (event: MouseEvent) => {
      this.leftPosition = event.pageX.toString() + 'px';
      this.topPosition = event.pageY.toString() + 'px';
      this.renderer.setStyle(this.temporaryTextElement.nativeElement, 'display', 'initial');
      this.renderer.setStyle(this.temporaryTextElement.nativeElement, 'transform', `scale(${this.mapScaleService.getScale()})`);
      this.temporaryTextElement.nativeElement.focus();

      let textListener = () => {
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
        let x = ((elem.label.originalX + this.editedNode.x - 1) * this.context.transformation.k) + this.context.getZeroZeroTransformationPoint().x + this.context.transformation.x;
        let y = ((elem.label.originalY + this.editedNode.y + 4) * this.context.transformation.k) + this.context.getZeroZeroTransformationPoint().y + this.context.transformation.y;
        this.leftPosition = x.toString() + 'px';
        this.topPosition = y.toString() + 'px';
        this.temporaryTextElement.nativeElement.innerText = elem.label.text;

        let styleProperties: StyleProperty[] = [];
        for (let property of elem.label.style.split(";")){
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
        
        let listener = () => {
          let innerText = this.temporaryTextElement.nativeElement.innerText;
          let link: Link = this.linksDataSource.get(this.editedLink.linkId);
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
        var transformData = textElements[index].parentElement.getAttribute('transform').split(/\(|\)/);
        var x = (Number(transformData[1].split(/,/)[0]) * this.context.transformation.k) + this.context.getZeroZeroTransformationPoint().x + this.context.transformation.x;
        var y = (Number(transformData[1].split(/,/)[1]) * this.context.transformation.k) + this.context.getZeroZeroTransformationPoint().y + this.context.transformation.y;
        this.leftPosition = x.toString() + 'px';
        this.topPosition = y.toString() + 'px';
        this.temporaryTextElement.nativeElement.innerText = elem.text;

        this.renderer.setStyle(this.temporaryTextElement.nativeElement, 'color', elem.fill);
        this.renderer.setStyle(this.temporaryTextElement.nativeElement, 'font-family', elem.font_family);
        this.renderer.setStyle(this.temporaryTextElement.nativeElement, 'font-size', `${elem.font_size}pt`);
        this.renderer.setStyle(this.temporaryTextElement.nativeElement, 'font-weight', elem.font_weight);

        let listener = () => {
          let innerText = this.temporaryTextElement.nativeElement.innerText;
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

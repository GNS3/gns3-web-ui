import {
  Component,
  ElementRef,
  EventEmitter,
  OnDestroy,
  OnInit,
  Renderer2,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { select } from 'd3-selection';
import { Subscription } from 'rxjs';
import { StyleProperty } from '@components/project-map/drawings-editors/text-editor/text-editor.component';
import { Link } from '@models/link';
import { Controller } from '@models/controller';
import { LinkService } from '@services/link.service';
import { MapScaleService } from '@services/mapScale.service';
import { ToolsService } from '@services/tools.service';
import { LinksDataSource } from '../../datasources/links-datasource';
import { NodesDataSource } from '../../datasources/nodes-datasource';
import { DrawingsEventSource } from '../../events/drawings-event-source';
import { TextAddedDataEvent, TextEditedDataEvent } from '../../events/event-source';
import { FontFixer } from '../../helpers/font-fixer';
import { SelectionManager } from '../../managers/selection-manager';
import { Context } from '../../models/context';
import { TextElement } from '../../models/drawings/text-element';
import { Font } from '../../models/font';
import { MapLinkNode } from '../../models/map/map-link-node';
import { Node } from '../../models/node';

@Component({
  standalone: true,
  selector: 'app-text-editor',
  templateUrl: './text-editor.component.html',
  styleUrls: ['./text-editor.component.scss'],
  imports: [],
})
export class TextEditorComponent implements OnInit, OnDestroy {
  readonly temporaryTextElement = viewChild<ElementRef>('temporaryTextElement');
  readonly svg = input<SVGSVGElement>(undefined);
  readonly controller = input<Controller>(undefined);

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

  private drawingsEventSource = inject(DrawingsEventSource);
  private toolsService = inject(ToolsService);
  private context = inject(Context);
  private renderer = inject(Renderer2);
  private mapScaleService = inject(MapScaleService);
  private linkService = inject(LinkService);
  private linksDataSource = inject(LinksDataSource);
  private nodesDataSource = inject(NodesDataSource);
  private selectionManager = inject(SelectionManager);
  private fontFixer = inject(FontFixer);

  ngOnInit() {
    this.textAddingSubscription = this.toolsService.isTextAddingToolActivated.subscribe((isActive: boolean) => {
      isActive ? this.activateTextAdding() : this.deactivateTextAdding();
    });

    // Note: In zoneless mode, runOutsideAngular is a no-op
    this.activateTextEditingForDrawings();
    this.activateTextEditingForNodeLabels();
  }

  activateTextAdding() {
    let addTextListener = (event: MouseEvent) => {
      this.leftPosition = event.pageX.toString() + 'px';
      this.topPosition = event.pageY.toString() + 'px';
      const temporaryTextElement = this.temporaryTextElement();
      this.renderer.setStyle(temporaryTextElement.nativeElement, 'display', 'initial');
      this.renderer.setStyle(
        temporaryTextElement.nativeElement,
        'transform',
        `scale(${this.mapScaleService.getScale()})`
      );
      temporaryTextElement.nativeElement.focus();
      document.documentElement.style.cursor = 'default';

      let textListener = () => {
        const temporaryTextElementValue = this.temporaryTextElement();
        this.drawingsEventSource.textAdded.emit(
          new TextAddedDataEvent(
            temporaryTextElementValue.nativeElement.innerText.replace(/\n$/, ''),
            event.pageX,
            event.pageY
          )
        );
        this.deactivateTextAdding();
        this.innerText = '';
        temporaryTextElementValue.nativeElement.innerText = '';
        temporaryTextElementValue.nativeElement.removeEventListener('focusout', this.textListener);
        this.renderer.setStyle(temporaryTextElementValue.nativeElement, 'display', 'none');
      };
      this.textListener = textListener;
      temporaryTextElement.nativeElement.addEventListener('focusout', this.textListener);
    };

    this.deactivateTextAdding();
    this.mapListener = addTextListener;
    this.svg().addEventListener('click', this.mapListener as EventListenerOrEventListenerObject);
  }

  deactivateTextAdding() {
    this.svg().removeEventListener('click', this.mapListener as EventListenerOrEventListenerObject);
  }

  activateTextEditingForNodeLabels() {
    const rootElement = select(this.svg());

    rootElement
      .selectAll<SVGGElement, MapLinkNode>('g.interface_label_container')
      .select<SVGTextElement>('text.interface_label')
      .on('dblclick', (elem, index, textElements) => {
        this.selectionManager.setSelected([]);

        const temporaryTextElement = this.temporaryTextElement();
        this.renderer.setStyle(temporaryTextElement.nativeElement, 'display', 'initial');
        this.renderer.setStyle(
          temporaryTextElement.nativeElement,
          'transform',
          `scale(${this.mapScaleService.getScale()})`
        );
        this.editedLink = elem;

        select(textElements[index]).attr('visibility', 'hidden');
        select(textElements[index]).classed('editingMode', true);

        this.editedNode = this.nodesDataSource.get(elem.nodeId);
        this.editedLink = elem;
        let x =
          (elem.label.originalX + this.editedNode.x - 1) * this.context.transformation.k +
          this.context.getZeroZeroTransformationPoint().x +
          this.context.transformation.x;
        let y =
          (elem.label.originalY + this.editedNode.y + 4) * this.context.transformation.k +
          this.context.getZeroZeroTransformationPoint().y +
          this.context.transformation.y;
        this.leftPosition = x.toString() + 'px';
        this.topPosition = y.toString() + 'px';
        temporaryTextElement.nativeElement.innerText = elem.label.text;

        let styleProperties: StyleProperty[] = [];
        for (let property of elem.label.style.split(';')) {
          styleProperties.push({
            property: property.split(': ')[0],
            value: property.split(': ')[1],
          });
        }
        let font: Font = {
          font_family: styleProperties.find((p) => p.property === 'font-family')
            ? styleProperties.find((p) => p.property === 'font-family').value
            : 'TypeWriter',
          font_size: styleProperties.find((p) => p.property === 'font-size')
            ? Number(styleProperties.find((p) => p.property === 'font-size').value)
            : 10.0,
          font_weight: styleProperties.find((p) => p.property === 'font-weight')
            ? styleProperties.find((p) => p.property === 'font-weight').value
            : 'normal',
        };
        font = this.fontFixer.fix(font);
        this.renderer.setStyle(
          temporaryTextElement.nativeElement,
          'color',
          styleProperties.find((p) => p.property === 'fill')
            ? styleProperties.find((p) => p.property === 'fill').value
            : '#000000'
        );
        this.renderer.setStyle(temporaryTextElement.nativeElement, 'font-family', font.font_family);
        this.renderer.setStyle(temporaryTextElement.nativeElement, 'font-size', `${font.font_size}pt`);
        this.renderer.setStyle(temporaryTextElement.nativeElement, 'font-weight', font.font_weight);

        let listener = () => {
          let innerText = this.temporaryTextElement().nativeElement.innerText;
          let link: Link = this.linksDataSource.get(this.editedLink.linkId);
          link.nodes.find((n) => n.node_id === this.editedNode.node_id).label.text = innerText;

          this.linkService.updateLink(this.controller(), link).subscribe((link: Link) => {
            rootElement
              .selectAll<SVGTextElement, TextElement>('text.editingMode')
              .attr('visibility', 'visible')
              .classed('editingMode', false);

            this.innerText = '';
            temporaryTextElement.nativeElement.innerText = '';
            temporaryTextElement.nativeElement.removeEventListener('focusout', this.textListener);

            this.clearStyle();
            this.renderer.setStyle(temporaryTextElement.nativeElement, 'display', 'none');
          });
        };
        this.textListener = listener;
        temporaryTextElement.nativeElement.addEventListener('focusout', this.textListener);
        temporaryTextElement.nativeElement.focus();
      });
  }

  activateTextEditingForDrawings() {
    const rootElement = select(this.svg());

    rootElement
      .selectAll<SVGTextElement, TextElement>('text.text_element')
      .on('dblclick', (elem, index, textElements) => {
        const temporaryTextElement = this.temporaryTextElement();
        this.renderer.setStyle(temporaryTextElement.nativeElement, 'display', 'initial');
        this.renderer.setStyle(
          temporaryTextElement.nativeElement,
          'transform',
          `scale(${this.mapScaleService.getScale()})`
        );
        this.editedElement = elem;

        select(textElements[index]).attr('visibility', 'hidden');
        select(textElements[index]).classed('editingMode', true);

        this.editingDrawingId = textElements[index].parentElement.parentElement.getAttribute('drawing_id');
        var transformData = textElements[index].parentElement.getAttribute('transform').split(/\(|\)/);
        var x =
          Number(transformData[1].split(/,/)[0]) * this.context.transformation.k +
          this.context.getZeroZeroTransformationPoint().x +
          this.context.transformation.x;
        var y =
          Number(transformData[1].split(/,/)[1]) * this.context.transformation.k +
          this.context.getZeroZeroTransformationPoint().y +
          this.context.transformation.y;
        this.leftPosition = x.toString() + 'px';
        this.topPosition = y.toString() + 'px';
        temporaryTextElement.nativeElement.innerText = elem.text;

        this.renderer.setStyle(temporaryTextElement.nativeElement, 'color', elem.fill);
        this.renderer.setStyle(temporaryTextElement.nativeElement, 'font-family', elem.font_family);
        this.renderer.setStyle(temporaryTextElement.nativeElement, 'font-size', `${elem.font_size}pt`);
        this.renderer.setStyle(temporaryTextElement.nativeElement, 'font-weight', elem.font_weight);

        let listener = () => {
          let innerText = this.temporaryTextElement().nativeElement.innerText;
          this.drawingsEventSource.textEdited.emit(
            new TextEditedDataEvent(this.editingDrawingId, innerText.replace(/\n$/, ''), this.editedElement)
          );

          rootElement
            .selectAll<SVGTextElement, TextElement>('text.editingMode')
            .attr('visibility', 'visible')
            .classed('editingMode', false);

          this.innerText = '';
          temporaryTextElement.nativeElement.innerText = '';
          temporaryTextElement.nativeElement.removeEventListener('focusout', this.textListener);

          this.clearStyle();
          this.renderer.setStyle(temporaryTextElement.nativeElement, 'display', 'none');
        };
        this.textListener = listener;
        temporaryTextElement.nativeElement.addEventListener('focusout', this.textListener);
        temporaryTextElement.nativeElement.focus();
      });
  }

  ngOnDestroy() {
    this.textAddingSubscription.unsubscribe();
  }

  clearStyle() {
    const temporaryTextElement = this.temporaryTextElement();
    this.renderer.setStyle(temporaryTextElement.nativeElement, 'color', '#000000');
    this.renderer.setStyle(temporaryTextElement.nativeElement, 'font-family', 'Noto Sans');
    this.renderer.setStyle(temporaryTextElement.nativeElement, 'font-size', '11pt');
    this.renderer.setStyle(temporaryTextElement.nativeElement, 'font-weight', 'bold');
  }
}

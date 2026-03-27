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
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { select } from 'd3-selection';
import { Subscription } from 'rxjs';
import { StyleProperty } from '@components/project-map/drawings-editors/text-editor/text-editor.component';
import { Link } from '@models/link';
import { Controller } from '@models/controller';
import { LinkService } from '@services/link.service';
import { NodeService } from '@services/node.service';
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
import { MapLabel } from '../../models/map/map-label';
import { MapLinkNode } from '../../models/map/map-link-node';
import { Node } from '../../models/node';

@Component({
  selector: 'app-text-editor',
  templateUrl: './text-editor.component.html',
  styleUrl: './text-editor.component.scss',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextEditorComponent implements OnInit, OnDestroy {
  readonly temporaryTextElement = viewChild<ElementRef>('temporaryTextElement');
  readonly svg = input<SVGSVGElement>(undefined);
  readonly controller = input<Controller>(undefined);

  leftPosition = signal<string>('0px');
  topPosition = signal<string>('0px');
  innerText = signal<string>('');

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
      this.leftPosition.set(event.pageX.toString() + 'px');
      this.topPosition.set(event.pageY.toString() + 'px');
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
        this.innerText.set('');
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
    const self = this;
    const rootElement = select(this.svg());

    rootElement
      .selectAll<SVGGElement, MapLinkNode>('g.interface_label_container')
      .select<SVGTextElement>('text.interface_label')
      .on('dblclick', function (this: SVGTextElement, event: MouseEvent, elem: MapLinkNode) {
        self.selectionManager.setSelected([]);

        const temporaryTextElement = self.temporaryTextElement();
        self.renderer.setStyle(temporaryTextElement.nativeElement, 'display', 'initial');
        self.renderer.setStyle(
          temporaryTextElement.nativeElement,
          'transform',
          `scale(${self.mapScaleService.getScale()})`
        );
        self.editedLink = elem;

        select(event.currentTarget as SVGTextElement).attr('visibility', 'hidden');
        select(event.currentTarget as SVGTextElement).classed('editingMode', true);

        self.editedNode = self.nodesDataSource.get(elem.nodeId);
        self.editedLink = elem;
        let x =
          (elem.label.originalX + self.editedNode.x - 1) * self.context.transformation.k +
          self.context.getZeroZeroTransformationPoint().x +
          self.context.transformation.x;
        let y =
          (elem.label.originalY + self.editedNode.y + 4) * self.context.transformation.k +
          self.context.getZeroZeroTransformationPoint().y +
          self.context.transformation.y;
        self.leftPosition.set(x.toString() + 'px');
        self.topPosition.set(y.toString() + 'px');
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
        font = self.fontFixer.fix(font);
        self.renderer.setStyle(
          temporaryTextElement.nativeElement,
          'color',
          styleProperties.find((p) => p.property === 'fill')
            ? styleProperties.find((p) => p.property === 'fill').value
            : '#000000'
        );
        self.renderer.setStyle(temporaryTextElement.nativeElement, 'font-family', font.font_family);
        self.renderer.setStyle(temporaryTextElement.nativeElement, 'font-size', `${font.font_size}pt`);
        self.renderer.setStyle(temporaryTextElement.nativeElement, 'font-weight', font.font_weight);

        let listener = () => {
          let innerText = self.temporaryTextElement().nativeElement.innerText;
          let link: Link = self.linksDataSource.get(self.editedLink.linkId);
          link.nodes.find((n) => n.node_id === self.editedNode.node_id).label.text = innerText;

          self.linkService.updateLink(self.controller(), link).subscribe((link: Link) => {
            rootElement
              .selectAll<SVGTextElement, TextElement>('text.editingMode')
              .attr('visibility', 'visible')
              .classed('editingMode', false);

            self.innerText.set('');
            temporaryTextElement.nativeElement.innerText = '';
            temporaryTextElement.nativeElement.removeEventListener('focusout', self.textListener);

            self.clearStyle();
            self.renderer.setStyle(temporaryTextElement.nativeElement, 'display', 'none');
          });
        };
        self.textListener = listener;
        temporaryTextElement.nativeElement.addEventListener('focusout', self.textListener);
        temporaryTextElement.nativeElement.focus();
      });
  }

  activateTextEditingForNodeNames() {
    select(this.svg)
      .selectAll<SVGGElement, MapLabel>('g.label_container')
      .select<SVGTextElement>('text.label')
      .on('dblclick', (label: MapLabel, index: number, textElements: SVGTextElement[]) => {
        this.selectionManager.setSelected([]);

        const temporaryText = this.temporaryTextElement.nativeElement;

        this.renderer.setStyle(temporaryText, 'display', 'initial');
        this.renderer.setStyle(
          temporaryText,
          'transform',
          `scale(${this.mapScaleService.getScale()})`
        );

        const node = this.nodesDataSource.get(label.nodeId);
        if (!node) {
          this.renderer.setStyle(temporaryText, 'display', 'none');
          return;
        }

        const editedTextElement = select(textElements[index]);
        editedTextElement.attr('visibility', 'hidden');
        editedTextElement.classed('editingMode', true);

        // Anchor editor to the exact rendered label position in viewport coordinates.
        const renderedLabelRect = textElements[index].getBoundingClientRect();
        this.leftPosition = `${renderedLabelRect.left + window.scrollX}px`;
        this.topPosition = `${renderedLabelRect.top + window.scrollY}px`;
        temporaryText.innerText = node.name || label.text || '';

        let isCancelled = false;
        let isCompleted = false;
        let keydownListener: (event: KeyboardEvent) => void;

        const cleanup = () => {
          temporaryText.removeEventListener('focusout', this.textListener);
          temporaryText.removeEventListener('keydown', keydownListener);

          editedTextElement.attr('visibility', 'visible').classed('editingMode', false);

          this.innerText = '';
          temporaryText.innerText = '';
          this.clearStyle();
          this.renderer.setStyle(temporaryText, 'display', 'none');
        };

        const completeNodeNameEditing = () => {
          if (isCompleted) {
            return;
          }
          isCompleted = true;

          const updatedName = temporaryText.innerText.replace(/[\r\n]+/g, '').trim();
          cleanup();

          if (isCancelled || !updatedName || updatedName === node.name) {
            return;
          }

          node.name = updatedName;
          this.nodeService.updateNode(this.controller, node).subscribe((updatedNode: Node) => {
            this.nodesDataSource.update(updatedNode);
          });
        };

        this.textListener = () => {
          completeNodeNameEditing();
        };

        keydownListener = (event: KeyboardEvent) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            temporaryText.blur();
          } else if (event.key === 'Escape' || event.key === 'Esc') {
            event.preventDefault();
            isCancelled = true;
            temporaryText.blur();
          }
        };

        temporaryText.addEventListener('focusout', this.textListener);
        temporaryText.addEventListener('keydown', keydownListener);
        temporaryText.focus();
      });
  }

  activateTextEditingForDrawings() {
    const self = this;
    const rootElement = select(this.svg());

    rootElement
      .selectAll<SVGTextElement, TextElement>('text.text_element')
      .on('dblclick', function (this: SVGTextElement, event: MouseEvent, elem: TextElement) {
        const temporaryTextElement = self.temporaryTextElement();
        self.renderer.setStyle(temporaryTextElement.nativeElement, 'display', 'initial');
        self.renderer.setStyle(
          temporaryTextElement.nativeElement,
          'transform',
          `scale(${self.mapScaleService.getScale()})`
        );
        self.editedElement = elem;

        const target = event.currentTarget as SVGTextElement;
        select(target).attr('visibility', 'hidden');
        select(target).classed('editingMode', true);

        self.editingDrawingId = target.parentElement.parentElement.getAttribute('drawing_id');
        var transformData = target.parentElement.getAttribute('transform').split(/\(|\)/);
        var x =
          Number(transformData[1].split(/,/)[0]) * self.context.transformation.k +
          self.context.getZeroZeroTransformationPoint().x +
          self.context.transformation.x;
        var y =
          Number(transformData[1].split(/,/)[1]) * self.context.transformation.k +
          self.context.getZeroZeroTransformationPoint().y +
          self.context.transformation.y;
        self.leftPosition.set(x.toString() + 'px');
        self.topPosition.set(y.toString() + 'px');
        temporaryTextElement.nativeElement.innerText = elem.text;

        self.renderer.setStyle(temporaryTextElement.nativeElement, 'color', elem.fill);
        self.renderer.setStyle(temporaryTextElement.nativeElement, 'font-family', elem.font_family);
        self.renderer.setStyle(temporaryTextElement.nativeElement, 'font-size', `${elem.font_size}pt`);
        self.renderer.setStyle(temporaryTextElement.nativeElement, 'font-weight', elem.font_weight);

        let listener = () => {
          let innerText = self.temporaryTextElement().nativeElement.innerText;
          self.drawingsEventSource.textEdited.emit(
            new TextEditedDataEvent(self.editingDrawingId, innerText.replace(/\n$/, ''), self.editedElement)
          );

          rootElement
            .selectAll<SVGTextElement, TextElement>('text.editingMode')
            .attr('visibility', 'visible')
            .classed('editingMode', false);

          self.innerText.set('');
          temporaryTextElement.nativeElement.innerText = '';
          temporaryTextElement.nativeElement.removeEventListener('focusout', self.textListener);

          self.clearStyle();
          self.renderer.setStyle(temporaryTextElement.nativeElement, 'display', 'none');
        };
        self.textListener = listener;
        temporaryTextElement.nativeElement.addEventListener('focusout', self.textListener);
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

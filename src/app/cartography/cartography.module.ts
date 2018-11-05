import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapComponent } from './components/map/map.component';
import { CssFixer } from './helpers/css-fixer';
import { FontFixer } from './helpers/font-fixer';
import { MultiLinkCalculatorHelper } from './helpers/multi-link-calculator-helper';
import { SvgToDrawingConverter } from './helpers/svg-to-drawing-converter';
import { QtDasharrayFixer } from './helpers/qt-dasharray-fixer';
import { LayersManager } from './managers/layers-manager';
import { MapChangeDetectorRef } from './services/map-change-detector-ref';
import { GraphLayout } from './widgets/graph-layout';
import { LinksWidget } from './widgets/links';
import { NodesWidget } from './widgets/nodes';
import { DrawingsWidget } from './widgets/drawings';
import { DrawingLineWidget } from './widgets/drawing-line';
import { SelectionTool } from './tools/selection-tool';
import { MovingTool } from './tools/moving-tool';
import { LayersWidget } from './widgets/layers';
import { LinkWidget } from './widgets/link';
import { InterfaceStatusWidget } from './widgets/interface-status';
import { InterfaceLabelWidget } from './widgets/interface-label';
import { EllipseDrawingWidget } from './widgets/drawings/ellipse-drawing';
import { ImageDrawingWidget } from './widgets/drawings/image-drawing';
import { RectDrawingWidget } from './widgets/drawings/rect-drawing';
import { TextDrawingWidget } from './widgets/drawings/text-drawing';
import { LineDrawingWidget } from './widgets/drawings/line-drawing';
import { Context } from './models/context';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [
    MapComponent,
  ],
  providers: [
    CssFixer,
    FontFixer,
    MultiLinkCalculatorHelper,
    SvgToDrawingConverter,
    QtDasharrayFixer,
    LayersManager,
    MapChangeDetectorRef,
    GraphLayout,
    LinksWidget,
    NodesWidget,
    DrawingsWidget,
    DrawingLineWidget,
    SelectionTool,
    MovingTool,
    LayersWidget,
    LinkWidget,
    InterfaceStatusWidget,
    InterfaceLabelWidget,
    EllipseDrawingWidget,
    ImageDrawingWidget,
    LineDrawingWidget,
    RectDrawingWidget,
    TextDrawingWidget,
    Context
  ],
  exports: [MapComponent]
})
export class CartographyModule { }

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatMenuModule, MatIconModule } from '@angular/material';

import { CssFixer } from './helpers/css-fixer';
import { FontFixer } from './helpers/font-fixer';
import { DefaultDrawingsFactory } from './helpers/default-drawings-factory';
import { MultiLinkCalculatorHelper } from './helpers/multi-link-calculator-helper';
import { SvgToDrawingConverter } from './helpers/svg-to-drawing-converter';
import { QtDasharrayFixer } from './helpers/qt-dasharray-fixer';
import { LayersManager } from './managers/layers-manager';
import { MapChangeDetectorRef } from './services/map-change-detector-ref';
import { Context } from './models/context';
import { ANGULAR_MAP_DECLARATIONS } from './angular-map.imports';
import { D3_MAP_IMPORTS } from './d3-map.imports';
import { CanvasSizeDetector } from './helpers/canvas-size-detector';
import { DrawingsEventSource } from './events/drawings-event-source';
import { NodesEventSource } from './events/nodes-event-source';
import { MapDrawingToSvgConverter } from './converters/map/map-drawing-to-svg-converter';
import { DrawingToMapDrawingConverter } from './converters/map/drawing-to-map-drawing-converter';
import { LabelToMapLabelConverter } from './converters/map/label-to-map-label-converter';
import { LinkToMapLinkConverter } from './converters/map/link-to-map-link-converter';
import { MapDrawingToDrawingConverter } from './converters/map/map-drawing-to-drawing-converter';
import { MapLabelToLabelConverter } from './converters/map/map-label-to-label-converter';
import { MapLinkNodeToLinkNodeConverter } from './converters/map/map-link-node-to-link-node-converter';
import { MapLinkToLinkConverter } from './converters/map/map-link-to-link-converter';
import { MapNodeToNodeConverter } from './converters/map/map-node-to-node-converter';
import { MapPortToPortConverter } from './converters/map/map-port-to-port-converter';
import { MapSymbolToSymbolConverter } from './converters/map/map-symbol-to-symbol-converter';
import { NodeToMapNodeConverter } from './converters/map/node-to-map-node-converter';
import { PortToMapPortConverter } from './converters/map/port-to-map-port-converter';
import { SymbolToMapSymbolConverter } from './converters/map/symbol-to-map-symbol-converter';
import { LinkNodeToMapLinkNodeConverter } from './converters/map/link-node-to-map-link-node-converter';
import { GraphDataManager } from './managers/graph-data-manager';
import {
  MapNodesDataSource,
  MapLinksDataSource,
  MapDrawingsDataSource,
  MapSymbolsDataSource
} from './datasources/map-datasource';
import { LinksEventSource } from './events/links-event-source';
import { D3MapComponent } from './components/d3-map/d3-map.component';
import { ExperimentalMapComponent } from './components/experimental-map/experimental-map.component';
import { SelectionEventSource } from './events/selection-event-source';
import { SelectionControlComponent } from './components/selection-control/selection-control.component';
import { SelectionSelectComponent } from './components/selection-select/selection-select.component';
import { DraggableSelectionComponent } from './components/draggable-selection/draggable-selection.component';
import { MapSettingsManager } from './managers/map-settings-manager';
import { DrawingResizingComponent } from './components/drawing-resizing/drawing-resizing.component';
import { FontBBoxCalculator } from './helpers/font-bbox-calculator';
import { StylesToFontConverter } from './converters/styles-to-font-converter';
import { TextElementFactory } from './helpers/drawings-factory/text-element-factory';
import { EllipseElementFactory } from './helpers/drawings-factory/ellipse-element-factory';
import { RectangleElementFactory } from './helpers/drawings-factory/rectangle-element-factory';
import { LineElementFactory } from './helpers/drawings-factory/line-element-factory';
import { TextEditorComponent } from './components/text-editor/text-editor.component';
import { DrawingAddingComponent } from './components/drawing-adding/drawing-adding.component';

@NgModule({
  imports: [CommonModule, MatMenuModule, MatIconModule],
  declarations: [
    D3MapComponent,
    ExperimentalMapComponent,
    DrawingAddingComponent,
    DrawingResizingComponent,
    TextEditorComponent,
    ...ANGULAR_MAP_DECLARATIONS,
    SelectionControlComponent,
    SelectionSelectComponent,
    DraggableSelectionComponent
  ],
  providers: [
    CssFixer,
    FontFixer,
    DefaultDrawingsFactory,
    TextElementFactory,
    EllipseElementFactory,
    RectangleElementFactory,
    LineElementFactory,
    MultiLinkCalculatorHelper,
    SvgToDrawingConverter,
    QtDasharrayFixer,
    LayersManager,
    MapChangeDetectorRef,
    CanvasSizeDetector,
    Context,
    DrawingsEventSource,
    NodesEventSource,
    LinksEventSource,
    MapDrawingToSvgConverter,
    DrawingToMapDrawingConverter,
    LabelToMapLabelConverter,
    LinkToMapLinkConverter,
    LinkNodeToMapLinkNodeConverter,
    MapDrawingToDrawingConverter,
    MapLabelToLabelConverter,
    MapLinkNodeToLinkNodeConverter,
    MapLinkToLinkConverter,
    MapNodeToNodeConverter,
    MapPortToPortConverter,
    MapSymbolToSymbolConverter,
    NodeToMapNodeConverter,
    PortToMapPortConverter,
    SymbolToMapSymbolConverter,
    GraphDataManager,
    MapNodesDataSource,
    MapLinksDataSource,
    MapDrawingsDataSource,
    MapSymbolsDataSource,
    SelectionEventSource,
    MapSettingsManager,
    FontBBoxCalculator,
    StylesToFontConverter,
    ...D3_MAP_IMPORTS
  ],
  exports: [D3MapComponent, ExperimentalMapComponent]
})
export class CartographyModule {}

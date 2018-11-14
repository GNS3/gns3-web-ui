import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatMenuModule, MatIconModule } from '@angular/material';

import { MapComponent } from './components/map/map.component';
import { DrawLinkToolComponent } from './components/draw-link-tool/draw-link-tool.component';
import { NodeSelectInterfaceComponent } from './components/node-select-interface/node-select-interface.component';

import { CssFixer } from './helpers/css-fixer';
import { FontFixer } from './helpers/font-fixer';
import { MultiLinkCalculatorHelper } from './helpers/multi-link-calculator-helper';
import { SvgToDrawingConverter } from './helpers/svg-to-drawing-converter';
import { QtDasharrayFixer } from './helpers/qt-dasharray-fixer';
import { LayersManager } from './managers/layers-manager';
import { MapChangeDetectorRef } from './services/map-change-detector-ref';
import { Context } from './models/context';
import { D3_MAP_IMPORTS } from './d3-map.imports';
import { CanvasSizeDetector } from './helpers/canvas-size-detector';
import { MapListeners } from './listeners/map-listeners';
import { DraggableListener } from './listeners/draggable-listener';
import { DrawingsEventSource } from './events/drawings-event-source';
import { NodesEventSource } from './events/nodes-event-source';
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
import { SelectionUpdateListener } from './listeners/selection-update-listener';
import { MapNodesDataSource, MapLinksDataSource, MapDrawingsDataSource, MapSymbolsDataSource } from './datasources/map-datasource';


@NgModule({
  imports: [
    CommonModule,
    MatMenuModule,
    MatIconModule
  ],
  declarations: [
    MapComponent,
    DrawLinkToolComponent,
    NodeSelectInterfaceComponent
  ],
  providers: [
    CssFixer,
    FontFixer,
    MultiLinkCalculatorHelper,
    SvgToDrawingConverter,
    QtDasharrayFixer,
    LayersManager,
    MapChangeDetectorRef,
    CanvasSizeDetector,
    Context,
    SelectionUpdateListener,
    MapListeners,
    DraggableListener,
    DrawingsEventSource,
    NodesEventSource,
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
    ...D3_MAP_IMPORTS
  ],
  exports: [ MapComponent ]
})
export class CartographyModule { }

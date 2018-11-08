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
import { DrawingsDraggableListener } from './listeners/drawings-draggable-listener';
import { NodesDraggableListener } from './listeners/nodes-draggable-listener';
import { DrawingsEventSource } from './events/drawings-event-source';
import { NodesEventSource } from './events/nodes-event-source';


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
    MapListeners,
    DrawingsDraggableListener,
    NodesDraggableListener,
    DrawingsEventSource,
    NodesEventSource,
    ...D3_MAP_IMPORTS
  ],
  exports: [ MapComponent ]
})
export class CartographyModule { }

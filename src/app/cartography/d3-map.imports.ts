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
import { NodeWidget } from './widgets/node';
import { DrawingWidget } from './widgets/drawing';

export const D3_MAP_IMPORTS = [
    GraphLayout,
    LinksWidget,
    NodesWidget,
    NodeWidget,
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
    DrawingWidget
];

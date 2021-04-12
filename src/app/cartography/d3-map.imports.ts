import { MovingTool } from './tools/moving-tool';
import { SelectionTool } from './tools/selection-tool';
import { DrawingWidget } from './widgets/drawing';
import { DrawingLineWidget } from './widgets/drawing-line';
import { DrawingsWidget } from './widgets/drawings';
import { EllipseDrawingWidget } from './widgets/drawings/ellipse-drawing';
import { ImageDrawingWidget } from './widgets/drawings/image-drawing';
import { LineDrawingWidget } from './widgets/drawings/line-drawing';
import { RectDrawingWidget } from './widgets/drawings/rect-drawing';
import { TextDrawingWidget } from './widgets/drawings/text-drawing';
import { GraphLayout } from './widgets/graph-layout';
import { InterfaceLabelWidget } from './widgets/interface-label';
import { InterfaceStatusWidget } from './widgets/interface-status';
import { LabelWidget } from './widgets/label';
import { LayersWidget } from './widgets/layers';
import { LinkWidget } from './widgets/link';
import { LinksWidget } from './widgets/links';
import { NodeWidget } from './widgets/node';
import { NodesWidget } from './widgets/nodes';

export const D3_MAP_IMPORTS = [
  GraphLayout,
  LinksWidget,
  NodesWidget,
  NodeWidget,
  LabelWidget,
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
  DrawingWidget,
];

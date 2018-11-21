import { DraggableComponent } from './components/draggable/draggable.component';
import { SelectionComponent } from './components/selection/selection.component';
import { NodeComponent } from './components/experimental-map/node/node.component';
import { LinkComponent } from './components/experimental-map/link/link.component';
import { StatusComponent } from './components/experimental-map/status/status.component';
import { DrawingComponent } from './components/experimental-map/drawing/drawing.component';
import { EllipseComponent } from './components/experimental-map/drawing/drawings/ellipse/ellipse.component';
import { ImageComponent } from './components/experimental-map/drawing/drawings/image/image.component';
import { LineComponent } from './components/experimental-map/drawing/drawings/line/line.component';
import { RectComponent } from './components/experimental-map/drawing/drawings/rect/rect.component';
import { TextComponent } from './components/experimental-map/drawing/drawings/text/text.component';
import { InterfaceLabelComponent } from './components/experimental-map/interface-label/interface-label.component';


export const ANGULAR_MAP_DECLARATIONS = [
    NodeComponent,
    LinkComponent,
    StatusComponent,
    DrawingComponent,
    EllipseComponent,
    ImageComponent,
    LineComponent,
    RectComponent,
    TextComponent,
    DraggableComponent,
    SelectionComponent,
    InterfaceLabelComponent
];

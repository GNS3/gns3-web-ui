import { TestSVGCanvas } from '../testing';
import { NodesWidget } from './nodes';
import { NodeWidget } from './node';
import { instance, mock } from 'ts-mockito';
import { MapSettingsManager } from '../managers/map-settings-manager';

describe('NodesWidget', () => {
  let svg: TestSVGCanvas;
  let nodeWidget: NodeWidget;
  let widget: NodesWidget;

  beforeEach(() => {
    svg = new TestSVGCanvas();
    nodeWidget = instance(mock(NodeWidget));
    widget = new NodesWidget(nodeWidget, new MapSettingsManager());
  });

  afterEach(() => {
    svg.destroy();
  });
});

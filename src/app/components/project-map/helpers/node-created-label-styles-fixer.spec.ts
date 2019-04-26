import { NodeCreatedLabelStylesFixer } from "./node-created-label-styles-fixer";
import { MapNode } from '../../../cartography/models/map/map-node';
import { Node } from '../../../cartography/models/node';
import { Label } from '../../../cartography/models/label';

describe('NodeCreatedLabelStylesFixer', () => {
  let fixer: NodeCreatedLabelStylesFixer;
  let nodeToMapNodeConverter;

  beforeEach(() => {
    nodeToMapNodeConverter = {
      convert: (node) => {
        const n = new MapNode();
        n.width = node.width;
        n.height = node.height;
        return n;
      }
    };

    fixer = new NodeCreatedLabelStylesFixer(
      nodeToMapNodeConverter
    );
  });

  it('should fix label styles and position', () => {
    const node = new Node();
    node.width = 100;
    node.height = 100;
    node.label = new Label();
    node.label.text = "my new label";

    const fixed = fixer.fix(node);

    expect(fixed.label.style).toEqual('font-family: TypeWriter;font-size: 10.0;font-weight: bold;fill: #000000;fill-opacity: 1.0;');
  });
});

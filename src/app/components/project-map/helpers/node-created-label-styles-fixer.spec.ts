import { Label } from '../../../cartography/models/label';
import { Node } from '../../../cartography/models/node';
import { NodeCreatedLabelStylesFixer } from './node-created-label-styles-fixer';

describe('NodeCreatedLabelStylesFixer', () => {
  let fixer: NodeCreatedLabelStylesFixer;
  let calculator;

  beforeEach(() => {
    calculator = {
      calculate: (text, styles) => {
        return {
          width: 50,
          height: 10,
        };
      },
    };

    fixer = new NodeCreatedLabelStylesFixer(calculator);
  });

  it('should fix label styles and position', () => {
    const node = new Node();
    node.width = 100;
    node.height = 100;
    node.label = new Label();
    node.label.text = 'my new label';

    const fixed = fixer.fix(node);

    expect(fixed.label.style).toEqual(
      'font-family: TypeWriter;font-size: 10.0;font-weight: bold;fill: #000000;fill-opacity: 1.0;'
    );
    expect(fixed.label.x).toEqual(25);
    expect(fixed.label.y).toEqual(-18);
  });
});

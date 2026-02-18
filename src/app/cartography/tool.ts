import { SVGSelection } from './models/types';

export interface Tool {
  connect(selection: SVGSelection);
  activate();
  deactivate();
}

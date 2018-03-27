import {Drawing} from "./drawing";
import {Link} from "./link";
import {Node} from "./node";

export class Layer {
  index: number;
  nodes: Node[];
  drawings: Drawing[];
  links: Link[];
}

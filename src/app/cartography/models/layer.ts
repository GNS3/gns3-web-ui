import {Drawing} from "./drawing";
import {Link} from "../../models/link";
import {Node} from "./node";

export class Layer {
  constructor(
    public index?: number,
    public nodes: Node[] = [],
    public drawings: Drawing[] = [],
    public links: Link[] = []
  ) {
  }
}

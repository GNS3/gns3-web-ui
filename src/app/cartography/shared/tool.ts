import {SVGSelection} from "../../map/models/types";

export interface Tool {
  connect(selection: SVGSelection);
}

import { SVGSelection } from "../../models/types";

export interface DrawingWidget {
  draw(view: SVGSelection);
}

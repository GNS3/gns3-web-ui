import { Injectable } from "@angular/core";
import { Subject } from "rxjs";
import { Rectangle } from "../models/rectangle";


@Injectable()
export class SelectionEventSource {
  public selected = new Subject<Rectangle>();
}
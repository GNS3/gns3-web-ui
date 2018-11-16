import { Injectable, EventEmitter } from "@angular/core";
import { MapLinkCreated } from "./links";


@Injectable()
export class LinksEventSource {
  public created = new EventEmitter<MapLinkCreated>();
}

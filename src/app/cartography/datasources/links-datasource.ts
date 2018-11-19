import { Injectable } from "@angular/core";

import { DataSource } from "./datasource";
import { Link } from "../../models/link";


@Injectable()
export class LinksDataSource extends DataSource<Link> {
  protected getItemKey(link: Link) {
    return link.link_id;
  }
}

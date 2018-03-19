import {Injectable} from "@angular/core";

import {DataSource} from "./datasource";
import {Link} from "../models/link.model";


@Injectable()
export class LinksDataSource extends DataSource<Link> {
  protected findIndex(link: Link) {
    return this.data.findIndex((l: Link) => l.link_id === link.link_id);
  }
}

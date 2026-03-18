import { Injectable } from '@angular/core';
import { Link } from '@models/link';
import { DataSource } from './datasource';

@Injectable()
export class LinksDataSource extends DataSource<Link> {
  protected getItemKey(link: Link) {
    return link.link_id;
  }
}

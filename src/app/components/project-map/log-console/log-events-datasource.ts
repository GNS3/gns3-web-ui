import { Injectable } from '@angular/core';
import { DataSource } from '../../../cartography/datasources/datasource';

@Injectable()
export class LogEventsDataSource extends DataSource<string> {
  protected getItemKey(log: string) {
    return log;
  }
}

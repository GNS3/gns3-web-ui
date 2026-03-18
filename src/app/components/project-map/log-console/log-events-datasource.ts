import { Injectable } from '@angular/core';
import { DataSource } from '../../../cartography/datasources/datasource';
import { LogEvent } from '@models/logEvent';

@Injectable()
export class LogEventsDataSource extends DataSource<LogEvent> {
  protected getItemKey(log: LogEvent) {
    return log;
  }
}

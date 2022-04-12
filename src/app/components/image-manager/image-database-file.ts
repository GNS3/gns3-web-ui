

import { DataSource, SelectionModel } from '@angular/cdk/collections';
import { MatSort } from '@angular/material/sort';
import { BehaviorSubject, Observable, Subscription, merge } from 'rxjs';
import { map } from 'rxjs/operators';
import { Image } from '../../models/images';


export class imageDatabase {
  dataChange: BehaviorSubject<Image[]> = new BehaviorSubject<Image[]>([]);
  get data(): Image[] {
    return this.dataChange.value;
  }

  public addImages(fileData: Image[]) {
    this.dataChange.next(fileData);
  }

}

export class imageDataSource extends DataSource<Image> {
  constructor(private serverDatabase: imageDatabase) {
    super();
  }

  connect(): Observable<Image[]> {
    return merge(this.serverDatabase.dataChange).pipe(
      map(() => {
        return this.serverDatabase.data;
      })
    );
  }

  disconnect() { }
}

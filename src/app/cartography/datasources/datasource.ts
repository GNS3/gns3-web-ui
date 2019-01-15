import { BehaviorSubject, Subject } from 'rxjs';

export abstract class DataSource<T> {
  protected data: T[] = [];
  protected dataChange: BehaviorSubject<T[]> = new BehaviorSubject<T[]>([]);
  protected itemUpdated: Subject<T> = new Subject<T>();

  public getItems(): T[] {
    return this.data;
  }

  public add(item: T) {
    const index = this.findIndex(item);
    if (index >= 0) {
      this.update(item);
    } else {
      this.data.push(item);
      this.dataChange.next(this.data);
    }
  }

  public set(data: T[]) {
    data.forEach(item => {
      const index = this.findIndex(item);
      if (index >= 0) {
        const updated = Object.assign(this.data[index], item);
        this.data[index] = updated;
      } else {
        this.data.push(item);
      }
    });

    const toRemove = this.data.filter(
      item => data.filter(i => this.getItemKey(i) === this.getItemKey(item)).length === 0
    );
    toRemove.forEach(item => this.remove(item));

    this.dataChange.next(this.data);
  }

  public get(key: string | number) {
    const index = this.data.findIndex((i: T) => this.getItemKey(i) === key);
    if (index >= 0) {
      return this.data[index];
    }
  }

  public update(item: T) {
    const index = this.findIndex(item);
    if (index >= 0) {
      const updated = Object.assign(this.data[index], item);
      this.data[index] = updated;
      this.dataChange.next(this.data);
      this.itemUpdated.next(updated);
    }
  }

  public remove(item: T) {
    const index = this.findIndex(item);
    if (index >= 0) {
      this.data.splice(index, 1);
      this.dataChange.next(this.data);
    }
  }

  public get changes() {
    return this.dataChange;
  }

  public get itemChanged() {
    return this.itemUpdated;
  }

  public clear() {
    this.data = [];
    this.dataChange.next(this.data);
  }

  private findIndex(item: T) {
    return this.data.findIndex((i: T) => this.getItemKey(i) === this.getItemKey(item));
  }

  protected abstract getItemKey(item: T): any;
}

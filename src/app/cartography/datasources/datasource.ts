import { BehaviorSubject, Subject } from "rxjs";

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
    this.data = data;
    this.dataChange.next(this.data);
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

  protected abstract findIndex(item: T): number;
}

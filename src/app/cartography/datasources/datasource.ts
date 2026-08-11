import { BehaviorSubject, Subject } from 'rxjs';

export abstract class DataSource<T> {
  protected data: T[] = [];
  // key -> array index, kept in sync with `data` for O(1) lookups. Item
  // references are mutated in place (Object.assign), so an item never changes
  // its array slot via update(); only add/remove/set shift indices (handled by
  // reindex).
  protected keyIndex = new Map<any, number>();
  protected dataChange: BehaviorSubject<T[]> = new BehaviorSubject<T[]>([]);
  protected itemUpdated: Subject<T> = new Subject<T>();

  public getItems(): T[] {
    return this.data;
  }

  public add(item: T) {
    const index = this.findIndex(item);
    if (index >= 0) {
      this.update(item);
      return;
    }
    // New array reference so signal consumers (signal.set) actually re-fire;
    // Object.is on the previous same-reference emit was a no-op.
    this.data = [...this.data, item];
    this.keyIndex.set(this.getItemKey(item), this.data.length - 1);
    this.dataChange.next(this.data);
  }

  public set(data: T[]) {
    // O(N) reconcile that preserves Object.assign merge semantics: existing
    // items are reused and mutated in place (so client-side fields such as
    // symbol_url/width/height are retained), items not present in `data` are
    // dropped.
    const newData: T[] = [];
    for (const item of data || []) {
      const key = this.getItemKey(item);
      const existingIdx = this.keyIndex.get(key);
      newData.push(existingIdx !== undefined ? Object.assign(this.data[existingIdx], item) : item);
    }
    this.data = newData;
    this.reindex();
    this.dataChange.next(this.data);
  }

  public get(key: string | number) {
    const index = this.keyIndex.get(key);
    if (index !== undefined) {
      return this.data[index];
    }
  }

  public update(item: T) {
    const index = this.findIndex(item);
    if (index >= 0) {
      // Mutate the existing item in place to preserve reference identity
      // (SelectionManager / D3 data-join / inline-window maps hold these
      // refs), but emit a NEW array reference so signal consumers re-fire.
      const updated = Object.assign(this.data[index], item);
      this.data = [...this.data];
      this.data[index] = updated;
      this.dataChange.next(this.data);
      this.itemUpdated.next(updated);
    }
  }

  public remove(item: T) {
    const index = this.findIndex(item);
    if (index >= 0) {
      this.data = this.data.filter((_, i) => i !== index);
      this.reindex();
      this.dataChange.next(this.data);
    }
  }

  /**
   * Batch-apply additions and removals with a single array-copy and
   * dataChange emission. Existing items that were mutated in-place by the
   * caller (Object.assign) do NOT need to be passed here — only structural
   * changes (new / dropped keys) require applyBatch.
   */
  public applyBatch(additions: T[], removals: T[]): void {
    // Single array copy for all additions (was O(K·N) — one [...data, item]
    // per addition). Index each new item by its position directly.
    if (additions.length > 0) {
      const startIdx = this.data.length;
      this.data = [...this.data, ...additions];
      for (let i = 0; i < additions.length; i++) {
        this.keyIndex.set(this.getItemKey(additions[i]), startIdx + i);
      }
    }

    if (removals.length > 0) {
      const removeKeys = new Set(removals.map((r) => this.getItemKey(r)));
      this.data = this.data.filter((item) => !removeKeys.has(this.getItemKey(item)));
      this.reindex();
    } else if (additions.length === 0) {
      // Fresh array reference so signal consumers re-fire
      this.data = [...this.data];
    }

    this.dataChange.next(this.data);
  }

  public get changes() {
    return this.dataChange;
  }

  public get itemChanged() {
    return this.itemUpdated;
  }

  public clear() {
    this.data = [];
    this.keyIndex.clear();
    this.dataChange.next(this.data);
  }

  private reindex() {
    this.keyIndex.clear();
    for (let i = 0; i < this.data.length; i++) {
      this.keyIndex.set(this.getItemKey(this.data[i]), i);
    }
  }

  protected findIndex(item: T) {
    const index = this.keyIndex.get(this.getItemKey(item));
    return index === undefined ? -1 : index;
  }

  protected abstract getItemKey(item: T): any;
}

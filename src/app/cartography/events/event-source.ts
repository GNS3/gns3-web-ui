export class DataEventSource<T> {
  constructor(
    public datum: T
  ) {}
}

export class DraggedDataEvent<T> extends DataEventSource<T> {}

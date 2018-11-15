export class DataEventSource<T> {
  constructor(
    public datum: T,
    public dx: number,
    public dy: number
  ) {}
}

export class DraggedDataEvent<T> extends DataEventSource<T> {}

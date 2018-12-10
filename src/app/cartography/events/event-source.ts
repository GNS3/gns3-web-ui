export class DataEventSource<T> {
  constructor(
    public datum: T,
    public dx: number,
    public dy: number
  ) {}
}

export class DraggedDataEvent<T> extends DataEventSource<T> {}

export class ClickedDataEvent<T> {
  constructor(
    public datum: T,
    public x: number,
    public y: number
  ) {}
}
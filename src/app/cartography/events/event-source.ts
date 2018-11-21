export class DataEventSource<T> {
  constructor(
    public datum: T,
    public dx: number,
    public dy: number
  ) {}
}

export class DraggedDataEvent<T> extends DataEventSource<T> {}

export class ResizedDataEvent<T> {
  constructor(
    public datum: T,
    public x: number,
    public y: number,
    public width: number,
    public height: number) {
  }
}

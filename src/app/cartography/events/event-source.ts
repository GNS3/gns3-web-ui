export class DataEventSource<T> {
  constructor(
    public datum: T
  ) {}
}


// class CreatedDataEvent<T> extends DataEventSource<T> {}
export class DraggedDataEvent<T> extends DataEventSource<T> {}

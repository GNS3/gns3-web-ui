import { Injectable } from '@angular/core';

import { BehaviorSubject } from 'rxjs';

export class State {
  public visible: boolean;
  public error: Error;
  public clear: boolean;

  constructor(visible: boolean, error?: Error, clear: boolean = false) {
    this.visible = visible;
    this.error = error;
    this.clear = clear;
  }
}

@Injectable()
export class ProgressService {
  state = new BehaviorSubject<State>(new State(false));

  constructor() {}

  public setError(error: Error) {
    this.state.next(new State(false, error));
  }

  public clear() {
    this.state.next(new State(false, null, true));
  }

  public activate() {
    this.state.next(new State(true));
  }

  public deactivate() {
    this.state.next(new State(false));
  }
}

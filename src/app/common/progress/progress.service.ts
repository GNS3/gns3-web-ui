import { Injectable } from '@angular/core';

import { BehaviorSubject } from "rxjs/BehaviorSubject";


export class State {
  public visible: boolean;

  constructor(visible: boolean) {
    this.visible = visible;
  }
}

@Injectable()
export class ProgressService {
  state = new BehaviorSubject<State>(new State(false));

  constructor() {}

  public activate() {
    this.state.next(new State(true));
  }

  public deactivate() {
    this.state.next(new State(false));
  }

}

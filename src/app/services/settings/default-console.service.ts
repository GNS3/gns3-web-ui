import { Injectable } from '@angular/core';

@Injectable()
export class DefaultConsoleService {
  constructor() {}

  get() {
    // Web application - cannot detect local terminal applications
    return undefined;
  }
}

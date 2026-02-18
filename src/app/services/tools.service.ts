import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable()
export class ToolsService {
  public isSelectionToolActivated = new Subject<boolean>();
  public isMovingToolActivated = new Subject<boolean>();
  public isTextEditingToolActivated = new Subject<boolean>();
  public isTextAddingToolActivated = new Subject<boolean>();
  public isDrawLinkToolActivated = new Subject<boolean>();

  constructor() {}

  selectionToolActivation(value: boolean) {
    this.isSelectionToolActivated.next(value);
  }

  movingToolActivation(value: boolean) {
    this.isMovingToolActivated.next(value);
  }

  textEditingToolActivation(value: boolean) {
    this.isTextEditingToolActivated.next(value);
  }

  textAddingToolActivation(value: boolean) {
    this.isTextAddingToolActivated.next(value);
  }

  drawLinkToolActivation(value: boolean) {
    this.isDrawLinkToolActivated.next(value);
  }
}

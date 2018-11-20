import { Component, ElementRef, Input, ChangeDetectorRef } from '@angular/core';


@Component({
  selector: '[app-status]',
  templateUrl: './status.component.html',
  styleUrls: ['./status.component.scss'],
})
export class StatusComponent  {
  static STOPPED_STATUS_RECT_WIDTH = 10;

  data = {
    'status': '',
    'path': null,
    'direction': null,
    'd': null
  };

  constructor(
    protected element: ElementRef,
    private ref: ChangeDetectorRef
  ) {}

  @Input('app-status') 
  set status(value) {
    this.data.status = value;
    this.ref.markForCheck();
  }

  @Input('path')
  set path(value) {
    this.data.path = value;
    this.ref.markForCheck();
  }

  @Input('direction')
  set direction(value) {
    this.data.direction = value;
    this.ref.markForCheck();
  }

  @Input('d')
  set d(value) {
    if (this.data.d !== value) {
      this.data.d = value;
      this.ref.markForCheck();
    }
  }

  get status() {
    return this.data.status;
  }

  get direction() {
    return this.data.direction;
  }
  
  get path() {
    return this.data.path;
  }

  get sourceStatusPoint() {
    if (!this.path) {
      return null;
    }
    return this.path.nativeElement.getPointAtLength(45);
  }

  get targetStatusPoint() {
    if (!this.path) {
      return null;
    }
    return this.path.nativeElement.getPointAtLength(this.path.nativeElement.getTotalLength() - 45);
  }

  get point() {
    if (this.direction === 'source') {
      return this.sourceStatusPoint;
    }
    return this.targetStatusPoint;
  }

}

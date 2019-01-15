import { Component, OnInit, Input, AfterViewInit, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import { Observable, Subscription, Subject } from 'rxjs';
import { Rectangle } from '../../../models/rectangle';

@Component({
  selector: '[app-selection]',
  templateUrl: './selection.component.html',
  styleUrls: ['./selection.component.scss']
})
export class SelectionComponent implements OnInit, AfterViewInit {
  @Input('app-selection') svg: SVGSVGElement;

  private startX: number;
  private startY: number;

  private width: number;
  private height: number;

  started = false;
  visible = false;
  draggable: Subscription;

  @Output('selected') rectangleSelected = new EventEmitter<Rectangle>();

  constructor(private ref: ChangeDetectorRef) {}

  ngOnInit() {}

  ngAfterViewInit() {
    const down = Observable.fromEvent(this.svg, 'mousedown').do((e: MouseEvent) => e.preventDefault());

    down.subscribe((e: MouseEvent) => {
      if (e.target !== this.svg) {
        return;
      }

      this.started = true;
      this.startX = e.clientX + window.scrollX;
      this.startY = e.clientY + window.scrollY;
      this.width = 0;
      this.height = 0;
      this.visible = true;
      this.ref.detectChanges();
    });

    const up = Observable.fromEvent(document, 'mouseup').do((e: MouseEvent) => {
      e.preventDefault();
    });

    const mouseMove = Observable.fromEvent(document, 'mousemove').do((e: MouseEvent) => e.stopPropagation());

    const scrollWindow = Observable.fromEvent(document, 'scroll').startWith({});

    const move = Observable.combineLatest(mouseMove, scrollWindow);

    const drag = down.mergeMap((md: MouseEvent) => {
      return move
        .map(([mm, s]) => mm)
        .do((mm: MouseEvent) => {
          if (!this.started) {
            return;
          }
          this.visible = true;
          this.width = mm.clientX - this.startX + window.scrollX;
          this.height = mm.clientY - this.startY + window.scrollY;

          this.ref.detectChanges();

          this.selectedEvent([this.startX, this.startY], [this.width, this.height]);
        })
        .skipUntil(
          up.take(1).do((e: MouseEvent) => {
            if (!this.started) {
              return;
            }
            this.visible = false;
            this.started = false;

            this.width = e.clientX - this.startX + window.scrollX;
            this.height = e.clientY - this.startY + window.scrollY;

            this.ref.detectChanges();

            this.selectedEvent([this.startX, this.startY], [this.width, this.height]);
          })
        )
        .take(1);
    });

    this.draggable = drag.subscribe((e: MouseEvent) => {
      // this.cd.detectChanges();
    });
  }

  ngOnDestroy() {
    this.draggable.unsubscribe();
  }

  get d() {
    return this.rect(this.startX, this.startY, this.width, this.height);
  }

  private rect(x: number, y: number, w: number, h: number) {
    return 'M' + [x, y] + ' l' + [w, 0] + ' l' + [0, h] + ' l' + [-w, 0] + 'z';
  }

  private selectedEvent(start, end) {
    const x = Math.min(start[0], end[0]);
    const y = Math.min(start[1], end[1]);
    const width = Math.abs(start[0] - end[0]);
    const height = Math.abs(start[1] - end[1]);
    this.rectangleSelected.emit(new Rectangle(x, y, width, height));
  }
}

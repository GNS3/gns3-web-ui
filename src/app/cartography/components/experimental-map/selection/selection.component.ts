import { AfterViewInit, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { fromEvent, combineLatest, Observable, Subscription } from 'rxjs';
import { map, mergeMap, skipUntil, take, tap, startWith } from 'rxjs/operators';
import { Rectangle } from '../../../models/rectangle';

@Component({
  standalone: false,
  selector: '[app-selection]',
  templateUrl: './selection.component.html',
  styleUrls: ['./selection.component.scss'],
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
    const down = fromEvent(this.svg, 'mousedown').pipe(
      tap((e: MouseEvent) => e.preventDefault())
    );
    down.subscribe((e: MouseEvent) => {
      if (e.target !== this.svg) {
        return;
      }

      this.started = true;
      this.startX = e?.clientX + window?.scrollX;
      this.startY = e?.clientY + window?.scrollY;
      this.width = 0;
      this.height = 0;
      this.visible = true;
      this.ref.detectChanges();
    });

    const up = fromEvent(document, 'mouseup').pipe(
      tap((e: MouseEvent) => {
        e.preventDefault();
      })
    );

    const mouseMove = fromEvent(document, 'mousemove').pipe(
      tap((e: MouseEvent) => e.stopPropagation())
    );

    const scrollWindow = fromEvent(document, 'scroll').pipe(
      startWith({})
    );

    const move = combineLatest([mouseMove, scrollWindow]);

    const drag = down.pipe(
      mergeMap((md: MouseEvent) => {
        return move
          .pipe(
            map(([mm, s]) => mm),
            tap((mm: MouseEvent) => {
              if (!this.started) {
                return;
              }
              this.visible = true;
              this.width = mm.clientX - this.startX + window.scrollX;
              this.height = mm.clientY - this.startY + window.scrollY;

              this.ref.detectChanges();

              this.selectedEvent([this.startX, this.startY], [this.width, this.height]);
            }),
            skipUntil(
              up.pipe(
                take(1),
                tap((e: MouseEvent) => {
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
            ),
            take(1)
          );
      })
    );

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

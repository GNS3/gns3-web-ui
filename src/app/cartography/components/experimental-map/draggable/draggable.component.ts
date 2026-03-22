import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  inject,
  input,
  ChangeDetectionStrategy,
} from '@angular/core';
import { fromEvent, combineLatest, Observable, Subscription } from 'rxjs';
import { map, mergeMap, skipUntil, take, tap, startWith } from 'rxjs/operators';
import { Point } from '../../../models/point';

export class DraggableDraggedEvent {
  constructor(public x: number, public y: number, public dx: number, public dy: number) {}
}

@Component({
  selector: '[app-draggable]',
  template: ` <ng-content></ng-content> `,
  styleUrl: './draggable.component.scss',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DraggableComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly item = input<Point>(undefined, { alias: 'app-draggable' });
  @Output() dragging = new EventEmitter<DraggableDraggedEvent>();
  @Output() dragged = new EventEmitter<DraggableDraggedEvent>();

  draggable: Subscription;

  private startX: number;
  private startY: number;

  private posX: number;
  private posY: number;

  private elementRef = inject(ElementRef);

  ngOnInit() {}

  ngAfterViewInit() {
    const down = fromEvent(this.elementRef.nativeElement, 'mousedown').pipe(tap((e: MouseEvent) => e.preventDefault()));

    down.subscribe((e: MouseEvent) => {
      const item = this.item();
      this.posX = item.x;
      this.posY = item.y;

      this.startX = e.clientX;
      this.startY = e.clientY;
    });

    const up = fromEvent(document, 'mouseup').pipe(
      tap((e: MouseEvent) => {
        e.preventDefault();
      })
    );

    const mouseMove = fromEvent(document, 'mousemove').pipe(tap((e: MouseEvent) => e.stopPropagation()));

    const scrollWindow = fromEvent(document, 'scroll').pipe(startWith({}));

    const move = combineLatest([mouseMove, scrollWindow]);

    const drag = down.pipe(
      mergeMap((md: MouseEvent) => {
        const item = this.item();
        return move.pipe(
          map(([mm, s]) => mm),
          tap((mm: MouseEvent) => {
            const x = this.startX - mm.clientX;
            const y = this.startY - mm.clientY;

            item.x = Math.round(this.posX - x);
            item.y = Math.round(this.posY - y);
            this.dragging.emit(new DraggableDraggedEvent(item.x, item.y, -x, -y));
          }),
          skipUntil(
            up.pipe(
              take(1),
              tap((e: MouseEvent) => {
                const x = this.startX - e.clientX;
                const y = this.startY - e.clientY;

                item.x = Math.round(this.posX - x);
                item.y = Math.round(this.posY - y);

                this.dragged.emit(new DraggableDraggedEvent(item.x, item.y, -x, -y));
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
}

import { Component, OnDestroy, OnInit, inject, input, ChangeDetectionStrategy } from '@angular/core';
import { Subscription } from 'rxjs';
import { DrawingsEventSource } from '../../events/drawings-event-source';
import { AddedDataEvent } from '../../events/event-source';
import { Context } from '../../models/context';

@Component({
  selector: 'app-drawing-adding',
  standalone: true,
  templateUrl: './drawing-adding.component.html',
  styleUrl: './drawing-adding.component.scss',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrawingAddingComponent implements OnInit, OnDestroy {
  readonly svg = input<SVGSVGElement>(undefined);

  private mapListener: Function;
  private drawingSelected: Subscription;

  private drawingsEventSource = inject(DrawingsEventSource);
  private context = inject(Context);

  ngOnInit() {
    this.drawingSelected = this.drawingsEventSource.selected.subscribe((evt) => {
      evt === '' ? this.deactivate() : this.activate();
    });
  }

  activate() {
    let listener = (event: MouseEvent) => {
      let x =
        (event.pageX - (this.context.getZeroZeroTransformationPoint().x + this.context.transformation.x)) /
        this.context.transformation.k;
      let y =
        (event.pageY - (this.context.getZeroZeroTransformationPoint().y + this.context.transformation.y)) /
        this.context.transformation.k;

      this.drawingsEventSource.pointToAddSelected.emit(new AddedDataEvent(x, y));
      this.deactivate();
    };

    this.deactivate();
    this.mapListener = listener;
    this.svg().addEventListener('click', this.mapListener as EventListenerOrEventListenerObject);
  }

  deactivate() {
    this.svg().removeEventListener('click', this.mapListener as EventListenerOrEventListenerObject);
  }

  ngOnDestroy() {
    this.drawingSelected.unsubscribe();
  }
}

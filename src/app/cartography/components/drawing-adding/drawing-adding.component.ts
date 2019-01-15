import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Context } from '../../models/context';
import { DrawingsEventSource } from '../../events/drawings-event-source';
import { AddedDataEvent } from '../../events/event-source';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-drawing-adding',
  templateUrl: './drawing-adding.component.html',
  styleUrls: ['./drawing-adding.component.scss']
})
export class DrawingAddingComponent implements OnInit, OnDestroy {
  @Input('svg') svg: SVGSVGElement;

  private mapListener: Function;
  private drawingSelected: Subscription;

  constructor(private drawingsEventSource: DrawingsEventSource, private context: Context) {}

  ngOnInit() {
    this.drawingSelected = this.drawingsEventSource.selected.subscribe(evt => {
      evt === '' ? this.deactivate() : this.activate();
    });
  }

  activate() {
    let listener = (event: MouseEvent) => {
      let x = event.clientX - this.context.getZeroZeroTransformationPoint().x;
      let y = event.clientY - this.context.getZeroZeroTransformationPoint().y;

      this.drawingsEventSource.pointToAddSelected.emit(new AddedDataEvent(x, y));
      this.deactivate();
    };

    this.deactivate();
    this.mapListener = listener;
    this.svg.addEventListener('click', this.mapListener as EventListenerOrEventListenerObject);
  }

  deactivate() {
    this.svg.removeEventListener('click', this.mapListener as EventListenerOrEventListenerObject);
  }

  ngOnDestroy() {
    this.drawingSelected.unsubscribe();
  }
}

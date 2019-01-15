import { DrawingAddingComponent } from './drawing-adding.component';
import { ComponentFixture, TestBed, async } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DrawingsEventSource } from '../../events/drawings-event-source';
import { Context } from '../../models/context';

describe('DrawingAddingComponent', () => {
  let component: DrawingAddingComponent;
  let fixture: ComponentFixture<DrawingAddingComponent>;
  let drawingsEventSource = new DrawingsEventSource();

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule],
      providers: [
        { provide: DrawingsEventSource, useValue: drawingsEventSource },
        { provide: Context, useClass: Context }
      ],
      declarations: [DrawingAddingComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DrawingAddingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should deactivate listener when none of the available drawings is selected', () => {
    spyOn(component, 'deactivate');

    drawingsEventSource.selected.emit('');

    expect(component.deactivate).toHaveBeenCalled();
  });

  it('should activate listener when drawing is selected', () => {
    spyOn(component, 'activate');

    drawingsEventSource.selected.emit('rectangle');

    expect(component.activate).toHaveBeenCalled();
  });
});

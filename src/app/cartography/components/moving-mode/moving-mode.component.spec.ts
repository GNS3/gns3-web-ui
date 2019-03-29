import { ComponentFixture, TestBed, async } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Context } from '../../models/context';
import { MovingModeComponent } from './moving-mode.component';
import { MovingEventSource } from '../../events/moving-event-source';

class SvgMock {
    addEventListener() {}
}

describe('MovingModeComponent', () => {
    let component: MovingModeComponent;
    let fixture: ComponentFixture<MovingModeComponent>;
    let movingEventSource = new MovingEventSource();
    let svg = new SvgMock();

    beforeEach(async(() => {
        TestBed.configureTestingModule({
        imports: [NoopAnimationsModule],
        providers: [
            { provide: MovingEventSource, useValue: movingEventSource },
            { provide: Context, useClass: Context }
        ],
        declarations: [MovingModeComponent]
        }).compileComponents();
    }));
    
    beforeEach(() => {
        fixture = TestBed.createComponent(MovingModeComponent);
        component = fixture.componentInstance;
        component.svg = svg as unknown as SVGSVGElement;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should activate listener when moving mode changed to true', () => {
        spyOn(component, 'activate');
    
        movingEventSource.movingModeState.emit(true);
    
        expect(component.activate).toHaveBeenCalled();
    });

    it('should deactivate listener when moving mode changed to false', () => {
        spyOn(component, 'deactivate');
    
        movingEventSource.movingModeState.emit(false);
    
        expect(component.deactivate).toHaveBeenCalled();
    });

    it('should add moousemove listener on activation', () => {
        spyOn(component, 'addMoveListener');
        spyOn(component.svg, 'addEventListener').and.returnValue({});
    
        component.activate();
    
        expect(component.addMoveListener).toHaveBeenCalled();
    });

    it('should add mousewheel listener on activation', () => {
        spyOn(component, 'addZoomListener');
        spyOn(component.svg, 'addEventListener').and.returnValue({});
    
        component.activate();
    
        expect(component.addZoomListener).toHaveBeenCalled();
    });
});

import { AddDrawingComponent } from "./add-drawing.component";
import { ComponentFixture, TestBed, async } from '@angular/core/testing';
import { DefaultDrawingsFactory } from '../../../cartography/helpers/default-drawings-factory';
import { DrawingService } from '../../../services/drawing.service';
import { DrawingsDataSource } from '../../../cartography/datasources/drawings-datasource';
import { MapDrawingToSvgConverter } from '../../../cartography/converters/map/map-drawing-to-svg-converter';
import { Context } from '../../../cartography/models/context';

describe('AddDrawingComponent', () => {
    let component: AddDrawingComponent;
    let fixture: ComponentFixture<AddDrawingComponent>;
    
    beforeEach(async(() => {
        TestBed.configureTestingModule({
            providers: [
                { provide: DrawingService },
                { provide: DrawingsDataSource },
                { provide: DefaultDrawingsFactory },
                { provide: MapDrawingToSvgConverter },
                { provide: Context }
            ],
            declarations: [
                AddDrawingComponent
            ]
        })
        .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(AddDrawingComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

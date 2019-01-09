import { TemporaryTextElementComponent } from "./temporary-text-element.component";
import { ComponentFixture, TestBed, async } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('TemporaryTextElementComponent', () => {
    let component: TemporaryTextElementComponent;
    let fixture: ComponentFixture<TemporaryTextElementComponent>;
    

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [
                NoopAnimationsModule
            ],
            providers: [

            ],
            declarations: [
                TemporaryTextElementComponent
            ]
        });
    }));
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialModule } from '@material.imports';
import { WebConsoleInlineComponent } from './web-console-inline.component';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { WindowBoundaryService } from '@services/window-boundary.service';
import { ToasterService } from '@services/toaster.service';
import { WindowManagementService } from '@services/window-management.service';
import { DomSanitizer } from '@angular/platform-browser';

describe('WebConsoleInlineComponent', () => {
  let component: WebConsoleInlineComponent;
  let fixture: ComponentFixture<WebConsoleInlineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WebConsoleInlineComponent, MaterialModule, NoopAnimationsModule],
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        WindowBoundaryService,
        ToasterService,
        WindowManagementService,
        DomSanitizer,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WebConsoleInlineComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

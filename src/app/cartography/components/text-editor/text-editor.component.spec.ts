import { TextEditorComponent } from './text-editor.component';
import { ComponentFixture, TestBed, async } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DrawingsEventSource } from '../../events/drawings-event-source';
import { ToolsService } from '../../../services/tools.service';
import { Context } from '../../models/context';
import { Renderer2 } from '@angular/core';

describe('TemporaryTextElementComponent', () => {
  let component: TextEditorComponent;
  let fixture: ComponentFixture<TextEditorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule],
      providers: [
        { provide: DrawingsEventSource, useClass: DrawingsEventSource },
        { provide: ToolsService, useClass: ToolsService },
        { provide: Context, useClass: Context },
        { provide: Renderer2, useClass: Renderer2 }
      ],
      declarations: [TextEditorComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TextEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { TextEditorComponent } from './text-editor.component';
import { ComponentFixture, TestBed, async } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DrawingsEventSource } from '../../events/drawings-event-source';
import { ToolsService } from '../../../services/tools.service';
import { Context } from '../../models/context';
import { Renderer2 } from '@angular/core';
import { MapScaleService } from '../../../services/mapScale.service';
import { LinkService } from '../../../services/link.service';
import { NodesDataSource } from '../../datasources/nodes-datasource';
import { LinksDataSource } from '../../datasources/links-datasource';
import { SelectionManager } from '../../managers/selection-manager';
import { FontFixer } from '../../helpers/font-fixer';
import { MockedLinkService } from '../../../components/project-map/project-map.component.spec';

describe('TextEditorComponent', () => {
  let component: TextEditorComponent;
  let fixture: ComponentFixture<TextEditorComponent>;
  let mockedLinkService: MockedLinkService = new MockedLinkService();

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule],
      providers: [
        { provide: DrawingsEventSource, useClass: DrawingsEventSource },
        { provide: ToolsService, useClass: ToolsService },
        { provide: Context, useClass: Context },
        { provide: Renderer2, useClass: Renderer2 },
        { provide: MapScaleService, useClass: MapScaleService },
        { provide: LinkService, useValue: mockedLinkService },
        { provide: NodesDataSource, useClass: NodesDataSource },
        { provide: LinksDataSource, useClass: LinksDataSource },
        { provide: SelectionManager, useClass: SelectionManager },
        { provide: FontFixer, useClass: FontFixer },
      ],
      declarations: [TextEditorComponent],
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

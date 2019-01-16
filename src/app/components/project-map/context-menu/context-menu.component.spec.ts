import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ContextMenuComponent } from './context-menu.component';
import { BrowserModule } from '@angular/platform-browser';
import { ChangeDetectorRef, NO_ERRORS_SCHEMA } from '@angular/core';
import { ProjectService } from '../../../services/project.service';
import { MockedProjectService } from '../../projects/add-blank-project-dialog/add-blank-project-dialog.component.spec';
import { MatMenuModule, MatMenuTrigger } from '@angular/material';
import { Drawing } from '../../../cartography/models/drawing';
import { RectElement } from '../../../cartography/models/drawings/rect-element';
import { TextElement } from '../../../cartography/models/drawings/text-element';

describe('ContextMenuComponent', () => {
  let component: ContextMenuComponent;
  let fixture: ComponentFixture<ContextMenuComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [MatMenuModule, BrowserModule],
      providers: [
        { provide: ChangeDetectorRef }, 
        { provide: ProjectService, useClass: MockedProjectService }
      ],
      declarations: [ContextMenuComponent],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ContextMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should reset capabilities while opening menu for node', () => {
    component.contextMenu = { openMenu() {} } as MatMenuTrigger;
    var spy = spyOn<any>(component, 'resetCapabilities');

    component.openMenuForNode(null, 0, 0);

    expect(spy.calls.any()).toBeTruthy();
  });

  it('should reset capabilities while opening menu for drawing', () => {
    component.contextMenu = { openMenu() {} } as MatMenuTrigger;
    let drawing = {} as Drawing;
    drawing.element = new RectElement();
    var spy = spyOn<any>(component, 'resetCapabilities');
    spyOn(component, 'setPosition').and.callFake(() => {});
    component.openMenuForDrawing(drawing, 0, 0);

    expect(spy.calls.any()).toBeTruthy();
  });

  it('should set correct flag while drawing is text element', () => {
    component.contextMenu = { openMenu() {} } as MatMenuTrigger;
    let drawing = {} as Drawing;
    drawing.element = new TextElement();
    var spy = spyOn<any>(component, 'resetCapabilities');
    spyOn(component, 'setPosition').and.callFake(() => {});
    component.openMenuForDrawing(drawing, 0, 0);

    expect(spy.calls.any()).toBeTruthy();
  });

  it('should reset capabilities while opening menu for list of elements', () => {
    component.contextMenu = { openMenu() {} } as MatMenuTrigger;
    var spy = spyOn<any>(component, 'resetCapabilities');
    spyOn(component, 'setPosition').and.callFake(() => {});
    component.openMenuForListOfElements([], [], [], 0, 0);

    expect(spy.calls.any()).toBeTruthy();
  });
});

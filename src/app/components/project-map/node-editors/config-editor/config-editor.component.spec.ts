import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
  MatFormFieldModule,
  MatSnackBarModule,
  MatTabsModule
} from '@angular/material';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs/internal/observable/of';
import { Node } from '../../../../cartography/models/node';
import { Server } from '../../../../models/server';
import { NodeService } from '../../../../services/node.service';
import { ToasterService } from '../../../../services/toaster.service';
import { MockedNodeService } from '../../project-map.component.spec';
import { ConfigEditorDialogComponent } from './config-editor.component';

describe('ConfigEditorDialogComponent', () => {
  let component: ConfigEditorDialogComponent;
  let fixture: ComponentFixture<ConfigEditorDialogComponent>;
  let server: Server;
  let node: Node;
  const toaster = {
    success: jasmine.createSpy('success')
  };
  const dialogRef = {
    close: jasmine.createSpy('close')
  };
  const mockedNodeService: MockedNodeService = new MockedNodeService();

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        MatDialogModule,
        MatFormFieldModule,
        NoopAnimationsModule,
        MatSnackBarModule,
        FormsModule,
        MatTabsModule
      ],
      providers: [
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA },
        { provide: NodeService, useValue: mockedNodeService },
        { provide: ToasterService, useValue: toaster }
      ],
      declarations: [ConfigEditorDialogComponent]
    }).compileComponents();

    server = new Server();
    server.host = 'localhost';
    server.port = 80;

    node = new Node();
    node.name = 'sample name';
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfigEditorDialogComponent);
    component = fixture.componentInstance;
    component.server = server;
    component.node = node;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(fixture).toBeDefined();
    expect(component).toBeTruthy();
  });

  it('should call node service when save configuration chosen', () => {
    spyOn(mockedNodeService, 'saveConfiguration').and.returnValue(of('sample config'));

    component.onSaveClick();

    expect(mockedNodeService.saveConfiguration).toHaveBeenCalled();
  });

  it('should not call node service when save configuration chosen', () => {
    spyOn(mockedNodeService, 'saveConfiguration').and.returnValue(of('sample config'));

    component.onCancelClick();

    expect(mockedNodeService.saveConfiguration).not.toHaveBeenCalled();
  });
});

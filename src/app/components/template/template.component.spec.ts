import { Overlay } from '@angular/cdk/overlay';
import { HttpClient, HttpHandler } from '@angular/common/http';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { Context } from 'app/cartography/models/context';
import { HttpController, ControllerErrorHandler } from 'app/services/http-controller.service';
import { MapScaleService } from 'app/services/mapScale.service';
import { SymbolService } from 'app/services/symbol.service';
import { TemplateService } from 'app/services/template.service';
import { MockedSymbolService } from '../preferences/common/symbols/symbols.component.spec';
import { TemplateComponent } from './template.component';

describe('TemplateComponent', () => {
  let component: TemplateComponent;
  let fixture: ComponentFixture<TemplateComponent>;
  let mockedSymbolService: MockedSymbolService
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TemplateComponent],
      imports: [MatDialogModule,MatMenuModule],
      providers: [
        MatDialog,
        Overlay,
        TemplateService,
        HttpController,
        MapScaleService,
        HttpClient,
        HttpHandler,
        ControllerErrorHandler,
        Context, 
        { provide: SymbolService, useClass: mockedSymbolService },
      ],
      schemas: [ CUSTOM_ELEMENTS_SCHEMA ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });
 afterEach(()=>{
   fixture.destroy()
 })
  it('should create', () => {
    expect(component).toBeTruthy();
  });

});

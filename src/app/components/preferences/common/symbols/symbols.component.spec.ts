import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { SymbolsComponent } from './symbols.component';
import { SymbolService } from '../../../../services/symbol.service';
import { HttpClientModule } from '@angular/common/http';
import { SearchFilter } from '../../../../filters/searchFilter.pipe';
import { MATERIAL_IMPORTS } from '../../../../material.imports';

export class MockedSymbolService {
    public list() {
      return of([]);
    }

    public raw() {
      return of('<svg></svg>')
    }
}

describe('Symbols component', () => {
    let component: SymbolsComponent;
    let fixture: ComponentFixture<SymbolsComponent>;
    let mockedSymbolsService = new MockedSymbolService;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
          imports:  [HttpClientModule, MATERIAL_IMPORTS, CommonModule, NoopAnimationsModule, RouterTestingModule.withRoutes([])],
          providers: [
              {
                  provide: SymbolService,  useValue: mockedSymbolsService
              }
          ],
          declarations: [
              SymbolsComponent,
              SearchFilter
          ],
          schemas: [NO_ERRORS_SCHEMA]
        }).compileComponents();
      }));
    
      beforeEach(() => {
        fixture = TestBed.createComponent(SymbolsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
      });
    
      it('should create', () => {
          expect(component).toBeTruthy();
      });

      it('should emit event when symbol selected', () => {
            spyOn(component.symbolChanged, 'emit');

            component.setSelected('id');

            expect(component.symbolChanged.emit).toHaveBeenCalled();
            expect(component.isSelected).toBe('id');
      });
});

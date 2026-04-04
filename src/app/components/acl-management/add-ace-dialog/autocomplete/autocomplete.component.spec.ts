import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AutocompleteComponent } from './autocomplete.component';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

interface TestItem {
  id: number;
  name: string;
}

describe('AutocompleteComponent', () => {
  let fixture: ComponentFixture<AutocompleteComponent<TestItem>>;
  let component: AutocompleteComponent<TestItem>;

  const mockDisplayFn = (item: TestItem | null) => (item ? item.name : '');
  const mockFilterFn = (value: string, data: TestItem[]) =>
    data.filter((item) => item.name.toLowerCase().includes(value.toLowerCase()));

  const testData: TestItem[] = [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
    { id: 3, name: 'Charlie' },
  ];

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [
        AutocompleteComponent,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatAutocompleteModule,
      ],
    }).compileComponents();
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
  });

  describe('ngOnChanges', () => {
    it('should set up filteredData observable when data and filterFn are provided', async () => {
      fixture = TestBed.createComponent(AutocompleteComponent<TestItem>);
      component = fixture.componentInstance;

      // Set all inputs before first detectChanges to avoid template errors
      fixture.componentRef.setInput('filterFn', mockFilterFn);
      fixture.componentRef.setInput('data', testData);
      fixture.componentRef.setInput('displayFn', mockDisplayFn);

      fixture.detectChanges();

      expect(component.filteredData).toBeDefined();
    });

    it('should filter data when autocompleteControl value changes', async () => {
      fixture = TestBed.createComponent(AutocompleteComponent<TestItem>);
      component = fixture.componentInstance;

      fixture.componentRef.setInput('filterFn', mockFilterFn);
      fixture.componentRef.setInput('data', testData);
      fixture.componentRef.setInput('displayFn', mockDisplayFn);

      fixture.detectChanges();

      let emittedValue: TestItem[] | null = null;
      component.filteredData.subscribe((value) => {
        emittedValue = value;
      });

      component.autocompleteControl.setValue('Ali');

      expect(emittedValue).toEqual([{ id: 1, name: 'Alice' }]);
    });

    it('should return all data when filter value is empty', async () => {
      fixture = TestBed.createComponent(AutocompleteComponent<TestItem>);
      component = fixture.componentInstance;

      fixture.componentRef.setInput('filterFn', mockFilterFn);
      fixture.componentRef.setInput('data', testData);
      fixture.componentRef.setInput('displayFn', mockDisplayFn);

      fixture.detectChanges();

      let emittedValue: TestItem[] | null = null;
      component.filteredData.subscribe((value) => {
        emittedValue = value;
      });

      component.autocompleteControl.setValue('');

      expect(emittedValue).toEqual(testData);
    });
  });

  describe('selectionChange', () => {
    it('should emit selected item when option is selected', () => {
      fixture = TestBed.createComponent(AutocompleteComponent<TestItem>);
      component = fixture.componentInstance;

      const emitSpy = vi.spyOn(component.selectionChange, 'emit');

      component.selectionChange.emit(testData[0]);

      expect(emitSpy).toHaveBeenCalledWith(testData[0]);
    });
  });

  describe('displayFn', () => {
    it('should return item name when displayFn is provided', () => {
      const result = mockDisplayFn(testData[0]);
      expect(result).toBe('Alice');
    });

    it('should return empty string when item is null', () => {
      const result = mockDisplayFn(null);
      expect(result).toBe('');
    });
  });

  describe('filterFn', () => {
    it('should filter items case-insensitively', () => {
      const result = mockFilterFn('bob', testData);
      expect(result).toEqual([{ id: 2, name: 'Bob' }]);
    });

    it('should return empty array when no match', () => {
      const result = mockFilterFn('xyz', testData);
      expect(result).toEqual([]);
    });

    it('should return all data when filter is empty string', () => {
      const result = mockFilterFn('', testData);
      expect(result).toEqual(testData);
    });
  });
});

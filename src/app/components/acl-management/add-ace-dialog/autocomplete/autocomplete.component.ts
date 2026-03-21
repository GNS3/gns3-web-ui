import {Component, EventEmitter, Input, OnChanges, OnInit, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {Observable} from "rxjs";
import {UntypedFormControl} from "@angular/forms";
import {map, startWith} from "rxjs/operators";

@Component({
  standalone: true,
  selector: 'app-autocomplete',
  templateUrl: './autocomplete.component.html',
  styleUrls: ['./autocomplete.component.scss'],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatAutocompleteModule]
})
export class AutocompleteComponent<T> implements OnChanges {

  @Input() data: T[];
  filteredData: Observable<T[]>;
  typeName: string
  autocompleteControl = new UntypedFormControl();

  @Input() eltType: string
  @Input() displayFn: (value: T) => string
  @Input() filterFn: (value: string, data: T[]) => T[]
  @Output() onSelection: EventEmitter<T> = new EventEmitter<T>();

  constructor() { }

  ngOnChanges(): void {
    this.filteredData = this.autocompleteControl.valueChanges.pipe(
      startWith(''),
      map(value => this.filterFn(value, this.data))
    )
  }

}

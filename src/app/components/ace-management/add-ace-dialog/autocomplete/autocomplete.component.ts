import {Component, EventEmitter, Input, OnChanges, OnInit, Output} from '@angular/core';
import {Group} from "@models/groups/group";
import {Observable} from "rxjs";
import {UntypedFormControl} from "@angular/forms";
import {map, startWith} from "rxjs/operators";
import {data} from "autoprefixer";

@Component({
  selector: 'app-autocomplete',
  templateUrl: './autocomplete.component.html',
  styleUrls: ['./autocomplete.component.scss']
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

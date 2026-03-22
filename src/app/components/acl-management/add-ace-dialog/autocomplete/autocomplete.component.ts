import { ChangeDetectionStrategy, Component, EventEmitter, OnChanges, OnInit, Output, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { Observable } from 'rxjs';
import { UntypedFormControl } from '@angular/forms';
import { map, startWith } from 'rxjs/operators';

@Component({
  standalone: true,
  selector: 'app-autocomplete',
  templateUrl: './autocomplete.component.html',
  styleUrls: ['./autocomplete.component.scss'],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatAutocompleteModule],
  // TODO: This component has been partially migrated to be zoneless-compatible.
  // After testing, this should be updated to ChangeDetectionStrategy.OnPush.
  changeDetection: ChangeDetectionStrategy.Default,
})
export class AutocompleteComponent<T> implements OnChanges {
  readonly data = input<T[]>(undefined);
  filteredData: Observable<T[]>;
  typeName: string;
  autocompleteControl = new UntypedFormControl();

  readonly eltType = input<string>(undefined);
  readonly displayFn = input<(value: T) => string>(undefined);
  readonly filterFn = input<(value: string, data: T[]) => T[]>(undefined);
  @Output() onSelection: EventEmitter<T> = new EventEmitter<T>();

  constructor() {}

  ngOnChanges(): void {
    this.filteredData = this.autocompleteControl.valueChanges.pipe(
      startWith(''),
      map((value) => this.filterFn()(value, this.data()))
    );
  }
}

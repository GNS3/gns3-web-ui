import { ChangeDetectionStrategy, Component, EventEmitter, Output, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { Controller } from '@models/controller';
import { SymbolsComponent } from '../symbols/symbols.component';

@Component({
  selector: 'app-symbols-menu',
  templateUrl: './symbols-menu.component.html',
  styleUrls: ['./symbols-menu.component.scss'],
  imports: [CommonModule, MatButtonModule, SymbolsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SymbolsMenuComponent {
  readonly controller = input<Controller>(undefined);
  readonly symbol = input<string>(undefined);
  @Output() symbolChangedEmitter = new EventEmitter<string>();

  readonly chosenSymbol = signal<string>('');

  symbolChanged(chosenSymbol: string) {
    this.chosenSymbol.set(chosenSymbol);
  }

  chooseSymbol() {
    this.symbolChangedEmitter.emit(this.chosenSymbol());
  }

  cancelChooseSymbol() {
    this.symbolChangedEmitter.emit(this.symbol());
  }
}

import { Component, EventEmitter, Output, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { Controller } from '@models/controller';
import { SymbolsComponent } from '../symbols/symbols.component';

@Component({
  standalone: true,
  selector: 'app-symbols-menu',
  templateUrl: './symbols-menu.component.html',
  styleUrls: ['./symbols-menu.component.scss', '../../preferences.component.scss'],
  imports: [CommonModule, MatButtonModule, SymbolsComponent],
})
export class SymbolsMenuComponent {
  readonly controller = input<Controller>(undefined);
  readonly symbol = input<string>(undefined);
  @Output() symbolChangedEmitter = new EventEmitter<string>();

  chosenSymbol: string = '';

  symbolChanged(chosenSymbol: string) {
    this.chosenSymbol = chosenSymbol;
  }

  chooseSymbol() {
    this.symbolChangedEmitter.emit(this.chosenSymbol);
  }

  cancelChooseSymbol() {
    this.symbolChangedEmitter.emit(this.symbol());
  }
}

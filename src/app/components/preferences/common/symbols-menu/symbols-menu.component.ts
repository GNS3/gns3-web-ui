import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Server } from '../../../../models/server';

@Component({
  selector: 'app-symbols-menu',
  templateUrl: './symbols-menu.component.html',
  styleUrls: ['./symbols-menu.component.scss', '../../preferences.component.scss'],
})
export class SymbolsMenuComponent {
  @Input() controller: Server;
  @Input() symbol: string;
  @Output() symbolChangedEmitter = new EventEmitter<string>();

  chosenSymbol: string = '';

  symbolChanged(chosenSymbol: string) {
    this.chosenSymbol = chosenSymbol;
  }

  chooseSymbol() {
    this.symbolChangedEmitter.emit(this.chosenSymbol);
  }

  cancelChooseSymbol() {
    this.symbolChangedEmitter.emit(this.symbol);
  }
}

import { Component, OnInit, Input, Output, EventEmitter } from "@angular/core";
import { SymbolService } from '../../../../services/symbol.service';
import { Server } from '../../../../models/server';
import { Symbol } from '../../../../models/symbol';


@Component({
    selector: 'app-symbols',
    templateUrl: './symbols.component.html',
    styleUrls: ['./symbols.component.scss']
})
export class SymbolsComponent implements OnInit {
    @Input() server: Server;
    @Input() symbol: string;
    @Output() symbolChanged = new EventEmitter<string>();
    
    symbols: Symbol[] = [];
    isSelected: string = '';
    searchText: string = '';

    constructor(
        private symbolService: SymbolService
    ) {}

    ngOnInit() {
        this.isSelected = this.symbol;

        this.symbolService.list(this.server).subscribe((symbols: Symbol[]) => {
            this.symbols = symbols;
        });
    }

    setSelected(symbol_id: string) {
        this.isSelected = symbol_id;
        this.symbolChanged.emit(this.isSelected);
    }
}

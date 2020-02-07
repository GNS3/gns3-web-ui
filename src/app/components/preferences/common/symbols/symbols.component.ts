import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { Server } from '../../../../models/server';
import { Symbol } from '../../../../models/symbol';
import { SymbolService } from '../../../../services/symbol.service';


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
    filteredSymbols: Symbol[] = [];
    isSelected = '';
    searchText = '';

    constructor(
        private symbolService: SymbolService
    ) {}

    ngOnInit() {
        this.isSelected = this.symbol;
        this.loadSymbols();
    }

    setFilter(filter: string) {
        if (filter === 'all') {
            this.filteredSymbols = this.symbols;
        } else if (filter === 'builtin') {
            this.filteredSymbols = this.symbols.filter(elem => elem.builtin);
        } else {
            this.filteredSymbols = this.symbols.filter(elem => !elem.builtin);
        }
    }

    setSelected(symbol_id: string) {
        this.isSelected = symbol_id;
        this.symbolChanged.emit(this.isSelected);
    }

    loadSymbols() {
        this.symbolService.list(this.server).subscribe((symbols: Symbol[]) => {
            this.symbols = symbols;
            this.filteredSymbols = symbols;
        });
    }

    public uploadSymbolFile(event) {
        this.readSymbolFile(event.target);
    }

    private readSymbolFile(symbolInput) {
        const file: File = symbolInput.files[0];
        const fileName = symbolInput.files[0].name;
        const fileReader: FileReader = new FileReader();
        const imageToUpload = new Image();
    
        fileReader.onloadend = () => {
            const image = fileReader.result;
            const svg = this.createSvgFileForImage(image, imageToUpload);
            this.symbolService.add(this.server, fileName, svg).subscribe(() => {
                this.loadSymbols();
            });
        };
            
        imageToUpload.onload = () => { fileReader.readAsDataURL(file); };
        imageToUpload.src = window.URL.createObjectURL(file);
    }

    private createSvgFileForImage(image: string|ArrayBuffer, imageToUpload: HTMLImageElement) {
        return `<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" height=\"${imageToUpload.height}\" 
                width=\"${imageToUpload.width}\">\n<image height=\"${imageToUpload.height}\" width=\"${imageToUpload.width}\" xlink:href=\"${image}\"/>\n</svg>`;
    }
}

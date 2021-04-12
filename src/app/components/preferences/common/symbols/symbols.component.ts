import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { SymbolService } from '../../../../services/symbol.service';
import { Server } from '../../../../models/server';
import { Symbol } from '../../../../models/symbol';

@Component({
  selector: 'app-symbols',
  templateUrl: './symbols.component.html',
  styleUrls: ['./symbols.component.scss'],
})
export class SymbolsComponent implements OnInit {
  @Input() server: Server;
  @Input() symbol: string;
  @Output() symbolChanged = new EventEmitter<string>();

  symbols: Symbol[] = [];
  filteredSymbols: Symbol[] = [];
  isSelected: string = '';
  searchText: string = '';

  constructor(private symbolService: SymbolService) {}

  ngOnInit() {
    this.isSelected = this.symbol;
    this.loadSymbols();
  }

  setFilter(filter: string) {
    if (filter === 'all') {
      this.filteredSymbols = this.symbols;
    } else if (filter === 'builtin') {
      this.filteredSymbols = this.symbols.filter((elem) => elem.builtin);
    } else {
      this.filteredSymbols = this.symbols.filter((elem) => !elem.builtin);
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
    let file: File = symbolInput.files[0];
    let fileName = symbolInput.files[0].name;
    let fileReader: FileReader = new FileReader();
    let imageToUpload = new Image();

    fileReader.onloadend = () => {
      let image = fileReader.result;
      let svg = this.createSvgFileForImage(image, imageToUpload);
      this.symbolService.add(this.server, fileName, svg).subscribe(() => {
        this.loadSymbols();
      });
    };

    imageToUpload.onload = () => {
      fileReader.readAsDataURL(file);
    };
    imageToUpload.src = window.URL.createObjectURL(file);
  }

  private createSvgFileForImage(image: string | ArrayBuffer, imageToUpload: HTMLImageElement) {
    return `<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" height=\"${imageToUpload.height}\" 
                width=\"${imageToUpload.width}\">\n<image height=\"${imageToUpload.height}\" width=\"${imageToUpload.width}\" xlink:href=\"${image}\"/>\n</svg>`;
  }

  getImageSourceForTemplate(symbol: string) {
    return `${this.server.protocol}//${this.server.host}:${this.server.port}/v2/symbols/${symbol}/raw`;
  }
}

import { Component, EventEmitter, Input, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatTabsModule } from '@angular/material/tabs';
import { environment } from 'environments/environment';
import { Controller } from '@models/controller';
import { Symbol } from '@models/symbol';
import { SymbolService } from '@services/symbol.service';
import { SearchFilter } from '@filters/searchFilter.pipe';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-symbols',
  templateUrl: './symbols.component.html',
  styleUrls: ['./symbols.component.scss'],
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatInputModule, MatRadioModule, MatTabsModule, SearchFilter],
})
export class SymbolsComponent implements OnInit {
  private symbolService = inject(SymbolService);
  private cd = inject(ChangeDetectorRef);

  @Input() controller: Controller;
  @Input() symbol: string;
  @Output() symbolChanged = new EventEmitter<string>();

  symbols: Symbol[] = [];
  filteredSymbols: Symbol[] = [];
  isSelected: string = '';
  searchText: string = '';

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
    this.symbolService.list(this.controller).subscribe((symbols: Symbol[]) => {
      this.symbols = symbols;
      this.filteredSymbols = symbols;
      this.cd.markForCheck();
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
      this.symbolService.add(this.controller, fileName, svg).subscribe(() => {
        this.loadSymbols();
      });
    };

    imageToUpload.onload = () => {
      fileReader.readAsDataURL(file);
    };
    imageToUpload.src = window.URL.createObjectURL(file);
  }

  private createSvgFileForImage(image: string | ArrayBuffer, imageToUpload: HTMLImageElement) {
    return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" height="${imageToUpload.height}"
                width="${imageToUpload.width}">\n<image height="${imageToUpload.height}" width="${imageToUpload.width}" xlink:href="${image}"/>\n</svg>`;
  }

  getImageSourceForTemplate(symbol: string) {
    return `${this.controller.protocol}//${this.controller.host}:${this.controller.port}/${environment.current_version}/symbols/${symbol}/raw`;
  }
}

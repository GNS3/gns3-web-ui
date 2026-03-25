import {
  Component,
  EventEmitter,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnInit,
  Output,
  inject,
  input,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatExpansionModule } from '@angular/material/expansion';
import { environment } from 'environments/environment';
import { Controller } from '@models/controller';
import { Symbol } from '@models/symbol';
import { SymbolService } from '@services/symbol.service';
import { SearchFilter } from '@filters/searchFilter.pipe';

interface SymbolGroup {
  theme: string;
  symbols: Symbol[];
}

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-symbols',
  templateUrl: './symbols.component.html',
  styleUrls: ['./symbols.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatRadioModule,
    MatExpansionModule,
    SearchFilter,
  ],
})
export class SymbolsComponent implements OnInit {
  private symbolService = inject(SymbolService);
  private cd = inject(ChangeDetectorRef);

  readonly controller = input<Controller>(undefined);
  readonly symbol = input<string>(undefined);
  @Output() symbolChanged = new EventEmitter<string>();

  symbols: Symbol[] = [];
  filteredSymbols: Symbol[] = [];
  symbolGroups: SymbolGroup[] = [];
  isSelected: string = '';
  searchText: string = '';
  expandedThemes = signal<string[]>([]);

  ngOnInit() {
    this.isSelected = this.symbol();
    this.loadSymbols();
  }

  toggleTheme(theme: string) {
    const current = this.expandedThemes();
    if (current.includes(theme)) {
      this.expandedThemes.set(current.filter((t) => t !== theme));
    } else {
      this.expandedThemes.set([...current, theme]);
    }
  }

  isThemeExpanded(theme: string): boolean {
    return this.expandedThemes().includes(theme);
  }

  setFilter(filter: string) {
    if (filter === 'all') {
      this.filteredSymbols = this.symbols;
    } else if (filter === 'builtin') {
      this.filteredSymbols = this.symbols.filter((elem) => elem.builtin);
    } else {
      this.filteredSymbols = this.symbols.filter((elem) => !elem.builtin);
    }
    this.updateSymbolGroups();
  }

  setSelected(symbol_id: string) {
    this.isSelected = symbol_id;
    this.symbolChanged.emit(this.isSelected);
  }

  loadSymbols() {
    this.symbolService.list(this.controller()).subscribe((symbols: Symbol[]) => {
      this.symbols = symbols;
      this.filteredSymbols = symbols;
      this.updateSymbolGroups();
      this.cd.markForCheck();
    });
  }

  private updateSymbolGroups() {
    const groupMap = new Map<string, Symbol[]>();
    for (const sym of this.filteredSymbols) {
      const theme = sym.theme || 'Other';
      if (!groupMap.has(theme)) {
        groupMap.set(theme, []);
      }
      groupMap.get(theme)!.push(sym);
    }
    this.symbolGroups = Array.from(groupMap.entries())
      .map(([theme, symbols]) => ({ theme, symbols }))
      .sort((a, b) => a.theme.localeCompare(b.theme));
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
      this.symbolService.add(this.controller(), fileName, svg).subscribe(() => {
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
    return `${this.controller().protocol}//${this.controller().host}:${this.controller().port}/${
      environment.current_version
    }/symbols/${symbol}/raw`;
  }
}

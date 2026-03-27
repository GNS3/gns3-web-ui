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
import { MatDialog } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { environment } from 'environments/environment';
import { Controller } from '@models/controller';
import { Symbol } from '@models/symbol';
import { SymbolService } from '@services/symbol.service';
import { SearchFilter } from '@filters/searchFilter.pipe';
import { ConfirmationDialogComponent } from '@components/dialogs/confirmation-dialog/confirmation-dialog.component';
import type { ConfirmationDialogData } from '@components/dialogs/confirmation-dialog/confirmation-dialog.component';

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
    MatDialogModule,
    MatTooltipModule,
    SearchFilter,
  ],
})
export class SymbolsComponent implements OnInit {
  private symbolService = inject(SymbolService);
  private cd = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);

  readonly controller = input<Controller>(undefined);
  readonly symbol = input<string>(undefined);
  @Output() symbolChanged = new EventEmitter<string>();

  symbols: Symbol[] = [];
  filteredSymbols: Symbol[] = [];
  symbolGroups: SymbolGroup[] = [];
  isSelected: string = '';
  searchText: string = '';
  expandedThemes = signal<string[]>([]);
  zoomLevel = signal(1.0);

  readonly Math = Math;

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

  private readSymbolFile(symbolInput: HTMLInputElement) {
    const file: File = symbolInput.files![0];
    if (!file) return;

    const fileName = file.name;
    const fileExtension = fileName.split('.').pop()?.toLowerCase();

    // SVG files: read as text
    if (fileExtension === 'svg' || fileExtension === 'svgz') {
      const fileReader: FileReader = new FileReader();

      fileReader.onloadend = () => {
        const svgContent = fileReader.result as string;
        this.symbolService.add(this.controller(), fileName, svgContent).subscribe(() => {
          this.loadSymbols();
        });
      };

      fileReader.readAsText(file);
    }
    // PNG/JPG/GIF: upload as binary blob
    else if (
      fileExtension === 'png' ||
      fileExtension === 'jpg' ||
      fileExtension === 'jpeg' ||
      fileExtension === 'gif'
    ) {
      // Create blob directly from file (no need for FileReader)
      const blob = new Blob([file], { type: file.type });
      this.symbolService.addFile(this.controller(), fileName, blob).subscribe(() => {
        this.loadSymbols();
      });
    }
    // Fallback: try as binary
    else {
      const blob = new Blob([file], { type: file.type || 'application/octet-stream' });
      this.symbolService.addFile(this.controller(), fileName, blob).subscribe(() => {
        this.loadSymbols();
      });
    }
  }

  getImageSourceForTemplate(symbol: string) {
    return `${this.controller().protocol}//${this.controller().host}:${this.controller().port}/${
      environment.current_version
    }/symbols/${symbol}/raw`;
  }

  canDeleteSymbol(symbol: Symbol): boolean {
    return !symbol.builtin;
  }

  deleteSymbol(symbol: Symbol, event: Event) {
    event.stopPropagation();

    const dialogData: ConfirmationDialogData = {
      title: 'Delete Symbol',
      message: `Are you sure you want to delete the symbol "${symbol.symbol_id}"?`,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
    };

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: dialogData,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.symbolService.delete(this.controller(), symbol.symbol_id).subscribe(() => {
          this.loadSymbols();
        });
      }
    });
  }

  zoomIn() {
    const current = this.zoomLevel();
    if (current < 2.0) {
      this.zoomLevel.set(Math.min(2.0, current + 0.1));
    }
  }

  zoomOut() {
    const current = this.zoomLevel();
    if (current > 0.5) {
      this.zoomLevel.set(Math.max(0.5, current - 0.1));
    }
  }

  resetZoom() {
    this.zoomLevel.set(1.0);
  }
}

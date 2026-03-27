import { ChangeDetectionStrategy, Component, inject, signal, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Controller } from '@models/controller';
import { Symbol } from '@models/symbol';
import { SymbolService } from '@services/symbol.service';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { forkJoin } from 'rxjs';
import { environment } from 'environments/environment';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-symbols-manager-dialog',
  templateUrl: './symbols-manager-dialog.component.html',
  styleUrls: ['./symbols-manager-dialog.component.scss'],
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatTabsModule,
    MatTooltipModule,
  ],
})
export class SymbolsManagerDialogComponent {
  private dialogRef = inject(MatDialogRef<SymbolsManagerDialogComponent>);
  private cd = inject(ChangeDetectorRef);
  private symbolService = inject(SymbolService);
  private data = inject(MAT_DIALOG_DATA);

  readonly controller = signal<Controller>(undefined);
  activeTab = signal(0);
  symbolsUpdated = new EventEmitter<void>();
  uploadStatus = signal<string>('');
  uploadSuccess = signal<boolean>(false);
  customSymbols = signal<Symbol[]>([]);
  selectedForDeletion = signal<Set<string>>(new Set());
  isLoading = signal(false);

  constructor() {
    if (this.data?.controller) {
      this.controller.set(this.data.controller);
      this.loadCustomSymbols();
    }
  }

  onCloseClick() {
    this.dialogRef.close();
  }

  onTabChange(index: number) {
    this.activeTab.set(index);
    if (index === 1) {
      // Load symbols when switching to Manage tab
      this.loadCustomSymbols();
    }
    this.cd.markForCheck();
  }

  loadCustomSymbols() {
    if (!this.controller()) return;

    this.symbolService.list(this.controller()).subscribe((symbols: Symbol[]) => {
      const custom = symbols.filter((s) => !s.builtin);
      this.customSymbols.set(custom);
      this.cd.markForCheck();
    });
  }

  getImageSource(symbolId: string): string {
    const ctrl = this.controller();
    if (!ctrl) return '';
    return `${ctrl.protocol}//${ctrl.host}:${ctrl.port}/${environment.current_version}/symbols/${symbolId}/raw`;
  }

  toggleSelection(symbolId: string) {
    const current = this.selectedForDeletion();
    const updated = new Set(current);

    if (updated.has(symbolId)) {
      updated.delete(symbolId);
    } else {
      updated.add(symbolId);
    }

    this.selectedForDeletion.set(updated);
    this.cd.markForCheck();
  }

  isSymbolSelected(symbolId: string): boolean {
    return this.selectedForDeletion().has(symbolId);
  }

  selectAllCustom() {
    const allIds = new Set(this.customSymbols().map((s) => s.symbol_id));
    this.selectedForDeletion.set(allIds);
    this.cd.markForCheck();
  }

  clearSelection() {
    this.selectedForDeletion.set(new Set());
    this.cd.markForCheck();
  }

  hasSelectedSymbols(): boolean {
    return this.selectedForDeletion().size > 0;
  }

  deleteSelectedSymbols() {
    const selectedSymbols = this.customSymbols().filter((s) =>
      this.selectedForDeletion().has(s.symbol_id)
    );

    if (selectedSymbols.length === 0) {
      return;
    }

    const deleteObservables = selectedSymbols.map((symbol) =>
      this.symbolService.delete(this.controller(), symbol.symbol_id)
    );

    forkJoin(deleteObservables).subscribe(() => {
      this.selectedForDeletion.set(new Set());
      this.loadCustomSymbols();
      this.symbolsUpdated.emit();
    });
  }

  uploadSymbolFile(event: Event) {
    const symbolInput = event.target as HTMLInputElement;
    const file: File = symbolInput.files![0];
    if (!file) return;

    const fileName = file.name;
    const fileExtension = fileName.split('.').pop()?.toLowerCase();

    // Reset status
    this.uploadStatus.set(`Uploading ${fileName}...`);
    this.uploadSuccess.set(false);
    this.cd.markForCheck();

    // SVG files: read as text
    if (fileExtension === 'svg' || fileExtension === 'svgz') {
      const fileReader: FileReader = new FileReader();

      fileReader.onloadend = () => {
        const svgContent = fileReader.result as string;
        this.symbolService.add(this.controller(), fileName, svgContent).subscribe({
          next: () => {
            this.uploadStatus.set(`Successfully uploaded ${fileName}`);
            this.uploadSuccess.set(true);
            this.symbolsUpdated.emit();
            this.cd.markForCheck();

            // Clear status after 3 seconds
            setTimeout(() => {
              this.uploadStatus.set('');
              this.cd.markForCheck();
            }, 3000);
          },
          error: (error) => {
            this.uploadStatus.set(`Failed to upload ${fileName}: ${error.message || 'Unknown error'}`);
            this.uploadSuccess.set(false);
            this.cd.markForCheck();
          }
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
      const blob = new Blob([file], { type: file.type });
      this.symbolService.addFile(this.controller(), fileName, blob).subscribe({
        next: () => {
          this.uploadStatus.set(`Successfully uploaded ${fileName}`);
          this.uploadSuccess.set(true);
          this.symbolsUpdated.emit();
          this.cd.markForCheck();

          // Clear status after 3 seconds
          setTimeout(() => {
            this.uploadStatus.set('');
            this.cd.markForCheck();
          }, 3000);
        },
        error: (error) => {
          this.uploadStatus.set(`Failed to upload ${fileName}: ${error.message || 'Unknown error'}`);
          this.uploadSuccess.set(false);
          this.cd.markForCheck();
        }
      });
    }
    // Fallback: try as binary
    else {
      const blob = new Blob([file], { type: file.type || 'application/octet-stream' });
      this.symbolService.addFile(this.controller(), fileName, blob).subscribe({
        next: () => {
          this.uploadStatus.set(`Successfully uploaded ${fileName}`);
          this.uploadSuccess.set(true);
          this.symbolsUpdated.emit();
          this.cd.markForCheck();

          // Clear status after 3 seconds
          setTimeout(() => {
            this.uploadStatus.set('');
            this.cd.markForCheck();
          }, 3000);
        },
        error: (error) => {
          this.uploadStatus.set(`Failed to upload ${fileName}: ${error.message || 'Unknown error'}`);
          this.uploadSuccess.set(false);
          this.cd.markForCheck();
        }
      });
    }

    // Reset the file input
    symbolInput.value = '';
  }
}
